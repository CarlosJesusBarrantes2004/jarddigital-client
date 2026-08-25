import { api } from "@/api/axios";
import type {
  Noticia,
  CreateNoticiaPayload,
  UpdateNoticiaPayload,
} from "../types/news.types";

export const newsService = {
  getAll: async (): Promise<Noticia[]> => {
    const { data } = await api.get("/news/noticias/");
    // Normalizar: puede venir paginado o como array
    if (Array.isArray(data)) return data;
    if (data?.results) return data.results;
    return [];
  },

  getById: async (id: number): Promise<Noticia> => {
    const { data } = await api.get(`/news/noticias/${id}/`);
    return data;
  },

  create: async (payload: CreateNoticiaPayload): Promise<Noticia> => {
    const { data } = await api.post("/news/noticias/", payload);
    return data;
  },

  update: async (
    id: number,
    payload: UpdateNoticiaPayload
  ): Promise<Noticia> => {
    const { data } = await api.patch(`/news/noticias/${id}/`, payload);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/news/noticias/${id}/`);
  },
};
