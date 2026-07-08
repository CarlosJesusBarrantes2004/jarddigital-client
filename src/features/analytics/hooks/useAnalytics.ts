import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";
import { analyticsService } from "../services/analytics.service";
import type {
  MatrizPivoteParams,
  BarrasRendimientoParams,
  TendenciaDiariaParams,
  NivelJerarquicoParams,
  RetencionPagosParams,
} from "../types/analytics.types";

// Mensaje de error consistente con el resto del proyecto (ver useFinances)
const manejarError = (contexto: string) => (error: unknown) => {
  console.error(`[analytics] ${contexto}:`, error);
  toast.error(`No se pudo cargar: ${contexto}`);
};

// ==========================================
// Gráficos 1 y 3 — Matriz Pivote
// ==========================================
export const useMatrizPivote = (params: MatrizPivoteParams) => {
  return useQuery({
    queryKey: ["analytics", "matriz-pivote", params],
    queryFn: () => analyticsService.getMatrizPivote(params),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 2,
    meta: { onError: manejarError("matriz de rendimiento") },
  });
};

// ==========================================
// Gráfico 2 — Barras de un mes específico
// ==========================================
export const useBarrasRendimientoMes = (params: BarrasRendimientoParams) => {
  return useQuery({
    queryKey: ["analytics", "barras-mes", params],
    queryFn: () => analyticsService.getBarrasRendimiento(params),
    enabled: !!params.mes,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 2,
    meta: { onError: manejarError("rendimiento del mes") },
  });
};

// ==========================================
// Gráfico 4 — Evolución mensual (sin mes fijo)
// ==========================================
export const useEvolucionMensual = (
  params: Omit<BarrasRendimientoParams, "mes">,
) => {
  return useQuery({
    queryKey: ["analytics", "evolucion-mensual", params],
    queryFn: () => analyticsService.getBarrasRendimiento(params),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 2,
    meta: { onError: manejarError("evolución mensual") },
  });
};

// ==========================================
// Gráfico 5 — Tendencia diaria (se usa 2 veces para comparar meses)
// ==========================================
export const useTendenciaDiaria = (params: TendenciaDiariaParams) => {
  return useQuery({
    queryKey: ["analytics", "tendencia-diaria", params],
    queryFn: () => analyticsService.getTendenciaDiaria(params),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 2,
    meta: { onError: manejarError("tendencia diaria") },
  });
};

// ==========================================
// Gráfico 6 — Nivel del árbol jerárquico
// ==========================================
export const useNivelJerarquico = (params: NivelJerarquicoParams) => {
  return useQuery({
    queryKey: ["analytics", "jerarquia", params],
    queryFn: () => analyticsService.getNivelJerarquico(params),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 2,
    meta: { onError: manejarError("distribución jerárquica") },
  });
};

export const useRetencionPagos = (params: RetencionPagosParams) => {
  return useQuery({
    queryKey: ["analytics", "retencion", params],
    queryFn: () => analyticsService.getRetencionPagos(params),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 2,
    meta: { onError: manejarError("retención de pagos") },
  });
};

export const useRetencionPagosPorAsesor = (params: RetencionPagosParams) => {
  return useQuery({
    queryKey: ["analytics", "retencion-asesor", params],
    queryFn: () => analyticsService.getRetencionPagosPorAsesor(params),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 2,
    meta: { onError: manejarError("retención por asesor") },
  });
};
