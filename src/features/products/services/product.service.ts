import { api } from "@/api/axios"; // Usamos la instancia oficial del proyecto
import type {
  Producto,
  ProductoFiltros,
  CreateProductoPayload,
  UpdateProductoPayload,
  ProductosResponse,
} from "../types/productos.types";

// Limpia undefined/null del objeto de filtros antes de enviarlo
function cleanParams(obj: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([, v]) => v !== undefined && v !== "" && v !== null,
    ),
  );
}

export const productosService = {
  /** Listado paginado con filtros */
  getAll: async (filtros: ProductoFiltros = {}): Promise<ProductosResponse> => {
    const { page = 1, ...rest } = filtros;
    const { data } = await api.get("/sales/productos/", {
      params: cleanParams({ ...rest, page }),
    });
    return data;
  },

  /** Detalle de un producto */
  getById: async (id: number): Promise<Producto> => {
    const { data } = await api.get(`/sales/productos/${id}/`);
    return data;
  },

  /** Crear producto */
  create: async (payload: CreateProductoPayload): Promise<Producto> => {
    const { data } = await api.post("/sales/productos/", payload);
    return data;
  },

  /** Edición parcial */
  update: async (
    id: number,
    payload: UpdateProductoPayload,
  ): Promise<Producto> => {
    const { data } = await api.patch(`/sales/productos/${id}/`, payload);
    return data;
  },

  /** Borrado lógico (activo=false) */
  softDelete: async (id: number): Promise<void> => {
    const { data } = await api.delete(`/sales/productos/${id}/`);
    return data;
  },

  /** Reactivar (activo=true) */
  reactivate: async (id: number): Promise<Producto> => {
    const { data } = await api.patch(`/sales/productos/${id}/`, {
      activo: true,
    });
    return data;
  },

  /** Obtener valores únicos de campaña (para filtros) */
  getCampanas: async (): Promise<string[]> => {
    const { data } = await api.get("/sales/productos/", {
      params: { page_size: 1000 },
    });

    const items: Producto[] = Array.isArray(data) ? data : (data.results ?? []);
    return [...new Set<string>(items.map((p) => p.nombre_campana))].sort();
  },
};
