import { api } from "@/api/axios";

import type {
  Branch,
  BranchPayload,
  Modality,
  ModalityPayload,
  Role,
  RolePayload,
} from "../types";

export const coreService = {
  // Branches
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

  // Modalities
  getModalities: async () => {
    const { data } = await api.get<Modality[]>("/core/modalidades/");
    return data;
  },
  createModality: async (payload: ModalityPayload) => {
    const { data } = await api.post<Modality>("/core/modalidades/", payload);
    return data;
  },
  updateModality: async (id: number, payload: Partial<ModalityPayload>) => {
    const { data } = await api.patch<Modality>(
      `/core/modalidades/${id}/`,
      payload,
    );
    return data;
  },
  deleteModality: async (id: number) => {
    await api.delete(`/core/modalidades/${id}/`);
  },

  // Roles
  getRoles: async () => {
    const { data } = await api.get<Role[]>("/users/roles/");
    return data;
  },
  createRole: async (payload: RolePayload) => {
    const { data } = await api.post<Role>("/users/roles/", payload);
    return data;
  },
  updateRole: async (id: number, payload: Partial<RolePayload>) => {
    const { data } = await api.patch(`/users/roles/${id}/`, payload);
    return data;
  },
  deleteRole: async (id: number) => {
    await api.delete(`/users/roles/${id}/`);
  },
};
