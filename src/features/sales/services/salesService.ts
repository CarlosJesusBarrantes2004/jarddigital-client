import { api } from "@/api/axios";
import type {
  Venta,
  VentaPayload,
  BackofficePayload,
  CatalogoItem,
  ProductoItem,
} from "../types";

export const salesService = {
  // Transacciones
  getVentas: async (params?: any) => {
    const { data } = await api.get<Venta[]>("/sales/ventas/", { params });
    return data;
  },
  createVenta: async (payload: VentaPayload) => {
    const { data } = await api.post<Venta>("/sales/ventas/", payload);
    return data;
  },
  updateVentaBackoffice: async (id: number, payload: BackofficePayload) => {
    const { data } = await api.patch<Venta>(`/sales/ventas/${id}/`, payload);
    return data;
  },

  // Catálogos
  getProductos: async () => {
    const { data } = await api.get<ProductoItem[]>("/sales/productos/");
    return data;
  },
  getGrabadores: async () => {
    const { data } = await api.get<any[]>("/sales/grabadores/");
    return data; // Mapear 'nombre_completo' en el frontend
  },
  getEstadosSOT: async () => {
    const { data } = await api.get<CatalogoItem[]>("/sales/estados-sot/");
    return data;
  },
  getSubEstadosSOT: async () => {
    const { data } = await api.get<CatalogoItem[]>("/sales/sub-estados-sot/");
    return data;
  },
  getEstadosAudio: async () => {
    const { data } = await api.get<CatalogoItem[]>("/sales/estados-audio/");
    return data;
  },
};
