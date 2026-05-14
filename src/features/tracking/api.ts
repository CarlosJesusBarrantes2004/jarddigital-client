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

function cleanParams(filters: SeguimientoFilters) {
  const params: Record<string, any> = {};
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      params[k] = v;
    }
  });
  return params;
}

export const trackingKeys = {
  all: ["seguimientos"] as const,
  lists: () => [...trackingKeys.all, "list"] as const,
  list: (filters: SeguimientoFilters) =>
    [...trackingKeys.lists(), filters] as const,
  detail: (id: number) => [...trackingKeys.all, "detail", id] as const,
};

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
      qc.invalidateQueries({
        queryKey: trackingKeys.detail(variables.seguimientoId),
      });
      qc.invalidateQueries({ queryKey: trackingKeys.lists() });
    },
  });
}

/**
 * NUEVO: Mutación para descargar el Excel de Pendientes Mes 1
 */
export async function exportarExcelPendientes(filters?: Record<string, any>) {
  const response = await api.get(
    "/tracking/seguimientos/exportar_pendientes_mes_1/",
    { params: filters, responseType: "blob" },
  );
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "Pendientes_Pago_Mes_1.xlsx");
  document.body.appendChild(link);
  link.click();
  link.remove();
}
