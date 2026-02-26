import { api } from "@/api/axios";
import type {
  Venta,
  CreateVentaPayload,
  UpdateVentaPayload,
  VentaFiltros,
  PaginatedResponse,
  EstadoSOT,
  SubEstadoSOT,
  EstadoAudio,
  Producto,
  GrabadorAudio,
  TipoDocumento,
  Departamento,
  Provincia,
  Distrito,
} from "../types/sales.types";

function normalizeList<T>(data: unknown): PaginatedResponse<T> {
  if (Array.isArray(data)) {
    return {
      count: data.length,
      next: null,
      previous: null,
      results: data as T[],
    };
  }
  const paged = data as PaginatedResponse<T>;
  if (paged.results !== undefined) return paged;
  return { count: 0, next: null, previous: null, results: [] };
}

// ==========================================
// VENTAS
// ==========================================

export const salesService = {
  getVentas: async (
    filtros?: VentaFiltros,
  ): Promise<PaginatedResponse<Venta>> => {
    const params = new URLSearchParams();
    if (filtros) {
      Object.entries(filtros).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, String(value));
        }
      });
    }
    const { data } = await api.get(`/sales/ventas/?${params.toString()}`);
    return normalizeList<Venta>(data);
  },

  getVenta: async (id: number): Promise<Venta> => {
    const { data } = await api.get<Venta>(`/sales/ventas/${id}/`);
    return data;
  },

  createVenta: async (payload: CreateVentaPayload): Promise<Venta> => {
    const { data } = await api.post<Venta>("/sales/ventas/", payload);
    return data;
  },

  updateVenta: async (
    id: number,
    payload: UpdateVentaPayload,
  ): Promise<Venta> => {
    const { data } = await api.patch<Venta>(`/sales/ventas/${id}/`, payload);
    return data;
  },

  deleteVenta: async (id: number): Promise<void> => {
    await api.delete(`/sales/ventas/${id}/`);
  },
};

// ==========================================
// CATÁLOGOS
// ==========================================

export const catalogosService = {
  getEstadosSOT: async (): Promise<EstadoSOT[]> => {
    const { data } = await api.get("/sales/estados-sot/");
    return normalizeList<EstadoSOT>(data).results;
  },
  getSubEstadosSOT: async (): Promise<SubEstadoSOT[]> => {
    const { data } = await api.get("/sales/sub-estados-sot/");
    return normalizeList<SubEstadoSOT>(data).results;
  },
  getEstadosAudio: async (): Promise<EstadoAudio[]> => {
    const { data } = await api.get("/sales/estados-audio/");
    return normalizeList<EstadoAudio>(data).results;
  },
  getProductos: async (): Promise<Producto[]> => {
    const { data } = await api.get("/sales/productos/?activo=true");
    return normalizeList<Producto>(data).results;
  },
  getGrabadores: async (): Promise<GrabadorAudio[]> => {
    const { data } = await api.get("/sales/grabadores/");
    return normalizeList<GrabadorAudio>(data).results;
  },
  getTiposDocumento: async (): Promise<TipoDocumento[]> => {
    const { data } = await api.get("/core/tipos-documento/");
    return normalizeList<TipoDocumento>(data).results;
  },
};

// ==========================================
// UBIGEO
// El backend filtra así:
//   provincias: ?id_departamento=X   (nombre del FK en el modelo)
//   distritos:  ?id_provincia=X
// ==========================================

export const ubigeoService = {
  getDepartamentos: async (): Promise<Departamento[]> => {
    const { data } = await api.get("/ubigeo/departamentos/");
    return normalizeList<Departamento>(data).results;
  },

  // Filtra por el nombre exacto del FK: id_departamento
  getProvincias: async (departamentoId: number): Promise<Provincia[]> => {
    const { data } = await api.get(
      `/ubigeo/provincias/?id_departamento=${departamentoId}`,
    );
    return normalizeList<Provincia>(data).results;
  },

  // Filtra por el nombre exacto del FK: id_provincia
  getDistritos: async (provinciaId: number): Promise<Distrito[]> => {
    const { data } = await api.get(
      `/ubigeo/distritos/?id_provincia=${provinciaId}`,
    );
    return normalizeList<Distrito>(data).results;
  },

  // Para pre-llenar la cascada en edición:
  // Dado un distrito_id, devuelve el distrito con su provincia e id_departamento
  getDistritoConPadres: async (
    distritoId: number,
  ): Promise<{
    departamentoId: number;
    provinciaId: number;
    distritoId: number;
  } | null> => {
    try {
      // 1. Obtenemos el distrito (tiene id_provincia)
      const { data: distrito } = await api.get<Distrito>(
        `/ubigeo/distritos/${distritoId}/`,
      );
      // 2. Obtenemos la provincia (tiene id_departamento)
      const { data: provincia } = await api.get<Provincia>(
        `/ubigeo/provincias/${distrito.id_provincia}/`,
      );
      return {
        departamentoId: provincia.id_departamento as number,
        provinciaId: distrito.id_provincia as number,
        distritoId: distrito.id,
      };
    } catch {
      return null;
    }
  },
};
