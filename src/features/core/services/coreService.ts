import { api } from "@/api/axios";
import type { Branch, BranchModality, BranchPayload } from "../types";

export const coreService = {
  getBranches: async () => {
    const { data } = await api.get<Branch[]>("/core/sucursales/");
    return data;
  },

  createBranch: async (payload: BranchPayload) => {
    const { data } = await api.post<Branch>("/core/sucursales/", payload);
    return data;
  },

  updateBranch: async (id: number, payload: Partial<BranchPayload>) => {
    const { data } = await api.patch<Branch>(
      `/core/sucursales/${id}/`,
      payload,
    );
    return data;
  },

  deleteBranch: async (id: number) => {
    await api.delete(`/core/sucursales/${id}/`);
  },

  getModalities: async () => {
    const { data } = await api.get<BranchModality[]>("/core/modalidades/");
    return data;
  },

  createModality: async (payload: { nombre: string; activo: boolean }) => {
    const { data } = await api.post<Modality>("/core/modalidades/", payload);
    return data;
  },
  updateModality: async (
    id: number,
    payload: { nombre: string; activo: boolean },
  ) => {
    const { data } = await api.patch<Modality>(
      `/core/modalidades/${id}/`,
      payload,
    );
    return data;
  },
  deleteModality: async (id: number) => {
    await api.delete(`/core/modalidades/${id}/`);
  },
};
