import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  salesService,
  catalogosService,
  ubigeoService,
} from "../services/sales.service";
import type {
  VentaFiltros,
  CreateVentaPayload,
  UpdateVentaAsesorPayload,
  UpdateVentaBackofficePayload,
  EstadisticasAsesor,
} from "../types/sales.types";
import { api } from "@/api/axios";

// ==========================================
// QUERY KEYS
// ==========================================

export const salesKeys = {
  all: ["ventas"] as const,
  lists: () => [...salesKeys.all, "list"] as const,
  list: (filtros?: VentaFiltros) => [...salesKeys.lists(), filtros] as const,
  detail: (id: number) => [...salesKeys.all, "detail", id] as const,

  catalogos: {
    estadosSOT: ["catalogos", "estados-sot"] as const,
    subEstadosSOT: ["catalogos", "sub-estados-sot"] as const,
    estadosAudio: ["catalogos", "estados-audio"] as const,
    productos: ["catalogos", "productos"] as const,
    grabadores: ["catalogos", "grabadores"] as const,
    tiposDocumento: ["catalogos", "tipos-documento"] as const,
  },

  ubigeo: {
    departamentos: ["ubigeo", "departamentos"] as const,
    provincias: (depId: number) => ["ubigeo", "provincias", depId] as const,
    distritos: (provId: number) => ["ubigeo", "distritos", provId] as const,
    distritoById: (id: number) => ["ubigeo", "distrito", id] as const,
  },
};

// ==========================================
// VENTAS QUERIES
// ==========================================

export function useVentas(filtros?: VentaFiltros) {
  return useQuery({
    queryKey: salesKeys.list(filtros),
    queryFn: () => salesService.getVentas(filtros),
    staleTime: 1000 * 30, // 30s
  });
}

export function useVenta(id: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: salesKeys.detail(id),
    queryFn: () => salesService.getVenta(id),
    enabled: !!id && (options?.enabled ?? true),
    staleTime: 1000 * 60,
  });
}

// ==========================================
// ESTADÍSTICAS ASESOR
// ==========================================

export function useEstadisticasAsesor(): {
  stats: EstadisticasAsesor;
  isLoading: boolean;
} {
  // Trae todas las ventas sin filtros (el backend ya filtra por asesor)
  const { data, isLoading } = useVentas();
  const ventas = data?.results ?? [];

  const stats: EstadisticasAsesor = {
    total: data?.count ?? 0,
    pendientes: ventas.filter(
      (v) => v.id_estado_sot === null && !v.solicitud_correccion,
    ).length,
    en_ejecucion: ventas.filter(
      (v) => v.codigo_estado?.toUpperCase() === "EJECUCION",
    ).length,
    atendidas: ventas.filter(
      (v) => v.codigo_estado?.toUpperCase() === "ATENDIDO",
    ).length,
    rechazadas: ventas.filter(
      (v) => v.codigo_estado?.toUpperCase() === "RECHAZADO",
    ).length,
    en_correccion: ventas.filter((v) => v.solicitud_correccion).length,
  };

  return { stats, isLoading };
}

// ==========================================
// MUTACIONES
// ==========================================

export function useCreateVenta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateVentaPayload) =>
      salesService.createVenta(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: salesKeys.lists() });
      qc.invalidateQueries({ queryKey: salesKeys.catalogos.grabadores }); // <-- ESTO BORRA EL CACHÉ
    },
  });
}

export function useUpdateVentaAsesor(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateVentaAsesorPayload) =>
      salesService.updateVentaAsesor(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: salesKeys.lists() });
      qc.invalidateQueries({ queryKey: salesKeys.detail(id) });
      qc.invalidateQueries({ queryKey: salesKeys.catalogos.grabadores }); // <-- ESTO BORRA EL CACHÉ
    },
  });
}

export function useUpdateVentaBackoffice(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateVentaBackofficePayload) =>
      salesService.updateVentaBackoffice(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: salesKeys.lists() });
      qc.invalidateQueries({ queryKey: salesKeys.detail(id) });
    },
  });
}

// ==========================================
// CATÁLOGOS QUERIES
// ==========================================

export function useEstadosSOT() {
  return useQuery({
    queryKey: salesKeys.catalogos.estadosSOT,
    queryFn: catalogosService.getEstadosSOT,
    staleTime: Infinity,
  });
}

export function useSubEstadosSOT() {
  return useQuery({
    queryKey: salesKeys.catalogos.subEstadosSOT,
    queryFn: catalogosService.getSubEstadosSOT,
    staleTime: Infinity,
  });
}

export function useEstadosAudio() {
  return useQuery({
    queryKey: salesKeys.catalogos.estadosAudio,
    queryFn: catalogosService.getEstadosAudio,
    staleTime: Infinity,
  });
}

export function useProductos() {
  return useQuery({
    queryKey: salesKeys.catalogos.productos,
    queryFn: catalogosService.getProductos,
    staleTime: 1000 * 60 * 5,
  });
}

export function useGrabadores(includeId?: number | null) {
  return useQuery({
    queryKey: [...salesKeys.catalogos.grabadores, includeId],
    queryFn: () => catalogosService.getGrabadores(includeId),
    staleTime: 1000 * 60 * 5,
  });
}

export function useTiposDocumento() {
  return useQuery({
    queryKey: salesKeys.catalogos.tiposDocumento,
    queryFn: catalogosService.getTiposDocumento,
    staleTime: Infinity,
  });
}

// ==========================================
// UBIGEO QUERIES
// ==========================================

export function useDepartamentos() {
  return useQuery({
    queryKey: salesKeys.ubigeo.departamentos,
    queryFn: ubigeoService.getDepartamentos,
    staleTime: Infinity,
  });
}

export function useProvincias(departamentoId: number | null | undefined) {
  return useQuery({
    queryKey: salesKeys.ubigeo.provincias(departamentoId!),
    queryFn: () => ubigeoService.getProvincias(departamentoId!),
    enabled: !!departamentoId,
    staleTime: Infinity,
  });
}

export function useDistritos(provinciaId: number | null | undefined) {
  return useQuery({
    queryKey: salesKeys.ubigeo.distritos(provinciaId!),
    queryFn: () => ubigeoService.getDistritos(provinciaId!),
    enabled: !!provinciaId,
    staleTime: Infinity,
  });
}

export function useDistritoById(distritoId: number | null | undefined) {
  return useQuery({
    queryKey: salesKeys.ubigeo.distritoById(distritoId!),
    queryFn: () => ubigeoService.getDistritoConPadres(distritoId!),
    enabled: !!distritoId,
    staleTime: Infinity,
  });
}

export function useDeleteVentaAsesor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/sales/ventas/${id}/`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: salesKeys.lists() });
    },
  });
}
