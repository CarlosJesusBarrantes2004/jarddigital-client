import { api } from "@/api/axios";

import type {
  Sale,
  SalePayload,
  BackofficePayload,
  CatalogItem,
  ProductItem,
} from "../types";

export const salesService = {
  getSales: async (params?: Record<string, string>) => {
    const { data } = await api.get<Sale[]>("/sales/ventas/", { params });
    return data;
  },
  createSale: async (payload: SalePayload) => {
    const { data } = await api.post<Sale>("/sales/ventas/", payload);
    return data;
  },
  updateSaleByBackoffice: async (id: number, payload: BackofficePayload) => {
    const { data } = await api.patch<Sale>(`/sales/ventas/${id}/`, payload);
    return data;
  },

  getProducts: async () => {
    const { data } = await api.get<ProductItem[]>("/sales/productos/");
    return data;
  },
  getEngravers: async () => {
    const { data } = await api.get<any[]>("/sales/grabadores/");
    return data;
  },
  getSOTStates: async () => {
    const { data } = await api.get<CatalogItem[]>("/sales/estados-sot/");
    return data;
  },
  getSOTSubStates: async () => {
    const { data } = await api.get<CatalogItem[]>("/sales/sub-estados-sot/");
    return data;
  },
  getAudioStates: async () => {
    const { data } = await api.get<CatalogItem[]>("/sales/estados-audio/");
    return data;
  },
};
