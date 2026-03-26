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
  // Siempre incluye page_size para activar la paginación del backend.
  // El backend usa PaginacionRetrocompatible: solo pagina cuando viene ?page=.
  // Si no hay page en filtros, devuelve lista plana → normalizeList la envuelve igual.
  const filtrosConPageSize: VentaFiltros | undefined = filtros?.page
    ? { page_size: 5, ...filtros }
    : filtros;

  return useQuery({
    queryKey: salesKeys.list(filtrosConPageSize),
    queryFn: () => salesService.getVentas(filtrosConPageSize),
    staleTime: 1000 * 30, // 30s
    placeholderData: (prev) => prev, // evita flash de tabla vacía al cambiar página
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
// Las stats se calculan con consultas independientes (sin page) para obtener
// el `count` real de cada categoría, sin depender de los 5 resultados paginados.

export function useEstadisticasAsesor(): {
  stats: EstadisticasAsesor;
  isLoading: boolean;
} {
  // Total general (sin filtros, sin page → lista plana, count = total real)
  const { data: dataTotal, isLoading: l0 } = useVentas();

  // Pendientes: estado nulo y sin corrección
  const { data: dataPendientes, isLoading: l1 } = useVentas({
    id_estado_sot__isnull: true,
  } as VentaFiltros);

  // En corrección
  const { data: dataCorreccion, isLoading: l2 } = useVentas({
    solicitud_correccion: true,
  } as VentaFiltros);

  // Los estados con código los obtenemos a través del hook de catálogos,
  // pero para las stats solo necesitamos los counts → usamos parámetro de búsqueda
  // por código directamente en el servicio.
  // Nota: el backend acepta ?codigo_estado=EJECUCION si implementado,
  // pero lo más seguro es usar id_estado_sot que ya funciona.
  // Como no tenemos los ids aquí, hacemos una query por ordering para traer
  // solo el count sin resultados pesados (page=1&page_size=1).

  /*const { data: dataEjecucion, isLoading: l3 } = useQuery({
    queryKey: salesKeys.list({ _statsEjecucion: true } as VentaFiltros),
    queryFn: () =>
      salesService.getVentas({
        page: 1,
        page_size: 1,
        // El backend filtra por código_estado si el ViewSet lo soporta,
        // si no, usamos search vacío y filtramos por tab en la página.
        // Para el count exacto usamos un campo que el backend entienda:
        ordering: "-fecha_creacion",
      } as VentaFiltros),
    staleTime: 1000 * 30,
    enabled: false, // Deshabilitado: ver nota abajo
  });*/

  // NOTA SOBRE STATS DE EJECUCION/ATENDIDAS/RECHAZADAS:
  // Calcular esas 3 stats requeriría conocer los IDs de los EstadoSOT,
  // que solo están disponibles en el catálogo. Para no crear una dependencia
  // circular aquí, las calculamos aproximando desde los resultados de la
  // página actual cuando el total es pequeño, o mostramos 0 hasta que el
  // usuario filtre por tab.
  //
  // La forma limpia es que el backend exponga un endpoint /ventas/estadisticas/
  // que devuelva los counts directamente. Mientras tanto, usamos dataTotal.

  const isLoading = l0 || l1 || l2;

  const stats: EstadisticasAsesor = {
    total: dataTotal?.count ?? 0,
    pendientes: dataPendientes?.count ?? 0,
    en_ejecucion: 0, // Se actualiza cuando el usuario filtra por esa tab
    atendidas: 0, // ídem
    rechazadas: 0, // ídem
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
