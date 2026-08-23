import { api } from "@/api/axios";
import type {
  Promocion,
  CreatePromocionPayload,
  UpdatePromocionPayload,
  Departamento,
  Provincia,
  Distrito,
} from "../types/promotions.types";

export const promotionsService = {
  // ── CRUD Promociones ──
  getAll: async (): Promise<Promocion[]> => {
    const { data } = await api.get("/promotions/promociones/");
    if (Array.isArray(data)) return data;
    if (data?.results) return data.results;
    return [];
  },

  create: async (payload: CreatePromocionPayload): Promise<Promocion> => {
    const { data } = await api.post("/promotions/promociones/", payload);
    return data;
  },

  update: async (
    id: number,
    payload: UpdatePromocionPayload
  ): Promise<Promocion> => {
    const { data } = await api.patch(`/promotions/promociones/${id}/`, payload);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/promotions/promociones/${id}/`);
  },

  // ── Búsqueda por distrito (asesor) ──
  buscarPorDistrito: async (distritoId: number): Promise<Promocion[]> => {
    const { data } = await api.get(
      `/promotions/promociones/buscar/?distrito_id=${distritoId}`
    );
    return data;
  },

  // ── Ubigeo ──
  getDepartamentos: async (): Promise<Departamento[]> => {
    const { data } = await api.get("/ubigeo/departamentos/");
    if (Array.isArray(data)) return data;
    if (data?.results) return data.results;
    return [];
  },

  getProvincias: async (depId: number): Promise<Provincia[]> => {
    const { data } = await api.get(
      `/ubigeo/provincias/?id_departamento=${depId}`
    );
    if (Array.isArray(data)) return data;
    if (data?.results) return data.results;
    return [];
  },

  getDistritos: async (provId: number): Promise<Distrito[]> => {
    const { data } = await api.get(
      `/ubigeo/distritos/?id_provincia=${provId}`
    );
    if (Array.isArray(data)) return data;
    if (data?.results) return data.results;
    return [];
  },

  buscarDistritos: async (q: string): Promise<any[]> => {
    const { data } = await api.get(`/ubigeo/distritos/buscar/?q=${encodeURIComponent(q)}`);
    return data;
  },
};
