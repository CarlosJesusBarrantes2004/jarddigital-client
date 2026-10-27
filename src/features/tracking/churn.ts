import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/axios";
import { fetchSeguimientos, trackingKeys, useSeguimientos } from "./api";
import type { NivelRiesgo, PrediccionChurn, Seguimiento, SeguimientoFilters } from "./types";

import { selectByRisk } from "./churn.utils";
export { riskLevel } from "./churn.utils";

// The first page renders normally. The shared collection supplies global KPIs
// and client-side risk filters without assuming undocumented backend filters.
export function useRetentionSeguimientos(filters: SeguimientoFilters, risk: NivelRiesgo | "", descending: boolean) {
  const qc = useQueryClient();
  const local = !!risk || descending;
  const pageQuery = useSeguimientos(filters, !local);
  const { page: requestedPage = 1, ...scope } = filters;
  const collection = useQuery({
    queryKey: [...trackingKeys.lists(), "retention", scope],
    queryFn: async ({ signal }) => {
      const rows: Seguimiento[] = [];
      let page = 1;
      while (true) {
        signal.throwIfAborted();
        const pageFilters = { ...scope, page };
        const data = await qc.fetchQuery({
          queryKey: trackingKeys.list(pageFilters),
          queryFn: ({ signal: pageSignal }) => fetchSeguimientos(pageFilters, pageSignal),
          staleTime: 30_000,
        });
        rows.push(...(Array.isArray(data) ? data : data.results));
        if (Array.isArray(data) || !data.next) break;
        page += 1;
      }
      return rows;
    },
    staleTime: 30_000,
  });
  const selected = selectByRisk(collection.data ?? [], risk, descending);
  const size = filters.page_size ?? 50;
  const raw = pageQuery.data;
  const rows = local ? selected.slice((requestedPage - 1) * size, requestedPage * size) : Array.isArray(raw) ? raw : raw?.results ?? [];
  const count = local ? selected.length : Array.isArray(raw) ? raw.length : raw?.count ?? 0;
  return {
    rows, count,
    isLoading: local ? collection.isPending : pageQuery.isPending,
    isError: local ? collection.isError : pageQuery.isError,
    retry: () => local ? collection.refetch() : pageQuery.refetch(),
    hasNext: local ? requestedPage * size < count : !Array.isArray(raw) && !!raw?.next,
    hasPrev: local ? requestedPage > 1 : !Array.isArray(raw) && !!raw?.previous,
    summary: collection,
  };
}

export function useShapPrediction(ventaId: number) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: ["churn-shap", ventaId],
    queryFn: async ({ signal }) => {
      const { data } = await api.post<PrediccionChurn>("/analytics/predict/", { venta_id: ventaId }, { signal });
      void qc.invalidateQueries({ queryKey: trackingKeys.all });
      return data;
    },
    retry: false,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useSyncPredictions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => (await api.post("/analytics/predict-batch/")).data,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: trackingKeys.all });
      void qc.invalidateQueries({ queryKey: ["churn-shap"] });
    },
  });
}
