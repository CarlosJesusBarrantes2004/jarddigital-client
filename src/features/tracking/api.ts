import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/axios";
import type {
  Seguimiento,
  SeguimientoMensual,
  SeguimientoFilters,
  UpdateSeguimientoPayload,
  UpdateSeguimientoMensualPayload,
  PaginatedResponse,
} from "./types";

// ─── Utility: Limpiar filtros para Axios ────────────────────
// Axios envía los params automáticamente, pero limpiamos los nulos/vacíos
// para no ensuciar la URL en el backend.
function cleanParams(filters: SeguimientoFilters) {
  const params: Record<string, any> = {};
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      params[k] = v;
    }
  });
  return params;
}

// ============================================================
// QUERY KEYS
// ============================================================
export const trackingKeys = {
  all: ["seguimientos"] as const,
  lists: () => [...trackingKeys.all, "list"] as const,
  list: (filters: SeguimientoFilters) =>
    [...trackingKeys.lists(), filters] as const,
  detail: (id: number) => [...trackingKeys.all, "detail", id] as const,
};

// ============================================================
// HOOKS — READ
// ============================================================

/** Fetch paginated list of Seguimientos with filters */
export function useSeguimientos(filters: SeguimientoFilters = {}) {
  return useQuery({
    queryKey: trackingKeys.list(filters),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Seguimiento>>(
        "/tracking/seguimientos/",
        { params: cleanParams(filters) },
      );
      return data;
    },
    staleTime: 30_000,
  });
}

/** Fetch single Seguimiento with all monthly detail */
export function useSeguimiento(id: number | null) {
  return useQuery({
    queryKey: trackingKeys.detail(id!),
    queryFn: async () => {
      const { data } = await api.get<Seguimiento>(
        `/tracking/seguimientos/${id}/`,
      );
      return data;
    },
    enabled: id !== null,
  });
}

// ============================================================
// HOOKS — MUTATIONS
// ============================================================

/** PATCH the Seguimiento header (ciclo_facturacion, estado, etc.) */
export function useUpdateSeguimiento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: UpdateSeguimientoPayload;
    }) => {
      const { data: responseData } = await api.patch<Seguimiento>(
        `/tracking/seguimientos/${id}/`,
        data,
      );
      return responseData;
    },
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: trackingKeys.lists() });
      qc.setQueryData(trackingKeys.detail(updated.id), updated);
    },
  });
}

/** PATCH a monthly record */
export function useUpdateSeguimientoMensual() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      seguimientoId: number;
      data: UpdateSeguimientoMensualPayload;
    }) => {
      const { data: responseData } = await api.patch<SeguimientoMensual>(
        `/tracking/seguimientos-mensuales/${id}/`,
        data,
      );
      return responseData;
    },
    onSuccess: (_updated, variables) => {
      // Invalida el seguimiento padre para que el panel lateral (Drawer) se refresque
      qc.invalidateQueries({
        queryKey: trackingKeys.detail(variables.seguimientoId),
      });
      qc.invalidateQueries({ queryKey: trackingKeys.lists() });
    },
  });
}
