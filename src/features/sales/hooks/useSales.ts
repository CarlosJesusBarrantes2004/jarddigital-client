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
  const filtrosConPageSize: VentaFiltros | undefined = filtros?.page
    ? { page_size: 5, ...filtros }
    : filtros;

  return useQuery({
    queryKey: salesKeys.list(filtrosConPageSize),
    queryFn: () => salesService.getVentas(filtrosConPageSize),
    staleTime: 1000 * 30,
    placeholderData: (prev) => prev,
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

export function useEstadisticasAsesor(filtrosFecha?: {
  fecha_inicio?: string;
  fecha_fin?: string;
}): {
  stats: EstadisticasAsesor;
  isLoading: boolean;
} {
  const { data: estadosSOT = [] } = useEstadosSOT();

  const idEjecucion = estadosSOT.find(
    (s) => s.codigo.toUpperCase() === "EJECUCION",
  )?.id;
  const idAtendido = estadosSOT.find(
    (s) => s.codigo.toUpperCase() === "ATENDIDO",
  )?.id;
  const idRechazado = estadosSOT.find(
    (s) => s.codigo.toUpperCase() === "RECHAZADO",
  )?.id;

  // Base de fechas que se propaga a todas las queries
  const fechaBase: VentaFiltros = {
    ...(filtrosFecha?.fecha_inicio
      ? { fecha_inicio: filtrosFecha.fecha_inicio }
      : {}),
    ...(filtrosFecha?.fecha_fin ? { fecha_fin: filtrosFecha.fecha_fin } : {}),
  };

  const { data: dataTotal, isLoading: l0 } = useQuery({
    queryKey: salesKeys.list({
      _stat: "total",
      ...fechaBase,
      page: 1,
      page_size: 1,
    } as VentaFiltros),
    queryFn: () =>
      salesService.getVentas({ ...fechaBase, page: 1, page_size: 1 }),
    staleTime: 1000 * 30,
  });

  const { data: dataPendientes, isLoading: l1 } = useQuery({
    queryKey: salesKeys.list({
      _stat: "pendientes",
      ...fechaBase,
      id_estado_sot__isnull: true,
      page: 1,
      page_size: 1,
    } as VentaFiltros),
    queryFn: () =>
      salesService.getVentas({
        ...fechaBase,
        id_estado_sot__isnull: true,
        page: 1,
        page_size: 1,
      }),
    staleTime: 1000 * 30,
  });

  const { data: dataEjecucion, isLoading: l2 } = useQuery({
    queryKey: salesKeys.list({
      _stat: "ejecucion",
      ...fechaBase,
      id_estado_sot: idEjecucion,
      page: 1,
      page_size: 1,
    } as VentaFiltros),
    queryFn: () =>
      salesService.getVentas({
        ...fechaBase,
        id_estado_sot: idEjecucion,
        page: 1,
        page_size: 1,
      }),
    enabled: !!idEjecucion,
    staleTime: 1000 * 30,
  });

  const { data: dataAtendidas, isLoading: l3 } = useQuery({
    queryKey: salesKeys.list({
      _stat: "atendidas",
      ...fechaBase,
      id_estado_sot: idAtendido,
      page: 1,
      page_size: 1,
    } as VentaFiltros),
    queryFn: () =>
      salesService.getVentas({
        ...fechaBase,
        id_estado_sot: idAtendido,
        page: 1,
        page_size: 1,
      }),
    enabled: !!idAtendido,
    staleTime: 1000 * 30,
  });

  const { data: dataRechazadas, isLoading: l4 } = useQuery({
    queryKey: salesKeys.list({
      _stat: "rechazadas",
      ...fechaBase,
      id_estado_sot: idRechazado,
      page: 1,
      page_size: 1,
    } as VentaFiltros),
    queryFn: () =>
      salesService.getVentas({
        ...fechaBase,
        id_estado_sot: idRechazado,
        page: 1,
        page_size: 1,
      }),
    enabled: !!idRechazado,
    staleTime: 1000 * 30,
  });

  const { data: dataCorreccion, isLoading: l5 } = useQuery({
    queryKey: salesKeys.list({
      _stat: "correccion",
      ...fechaBase,
      solicitud_correccion: true,
      page: 1,
      page_size: 1,
    } as VentaFiltros),
    queryFn: () =>
      salesService.getVentas({
        ...fechaBase,
        solicitud_correccion: true,
        page: 1,
        page_size: 1,
      }),
    staleTime: 1000 * 30,
  });

  const isLoading = l0 || l1 || l2 || l3 || l4 || l5;

  const stats: EstadisticasAsesor = {
    total: dataTotal?.count ?? 0,
    pendientes: dataPendientes?.count ?? 0,
    en_ejecucion: dataEjecucion?.count ?? 0,
    atendidas: dataAtendidas?.count ?? 0,
    rechazadas: dataRechazadas?.count ?? 0,
    en_correccion: dataCorreccion?.count ?? 0,
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
      qc.invalidateQueries({ queryKey: salesKeys.catalogos.grabadores });
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
      qc.invalidateQueries({ queryKey: salesKeys.catalogos.grabadores });
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
    mutationFn: (id: number) => api.delete(`/sales/ventas/${id}/hard-delete/`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: salesKeys.lists() });
    },
  });
}
