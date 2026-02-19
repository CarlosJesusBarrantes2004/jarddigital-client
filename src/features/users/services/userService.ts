import { api } from "@/api/axios";
import type {
  BranchModalityOption,
  Role,
  User,
  UserFilters,
  UserPayload,
} from "../types";

export const userService = {
  getAll: async (filters?: UserFilters) => {
    const params = new URLSearchParams();

    if (filters?.search) params.append("search", filters.search);
    if (filters?.id_rol) params.append("id_role", filters.id_rol.toString());

    const { data } = await api.get<User[]>(
      `/users/empleados/?${params.toString()}`,
    );
    return data;
  },

  getById: async (id: number) => {
    const { data } = await api.get(`/users/empleados/${id}`);
    return data;
  },

  create: async (payload: UserPayload) => {
    const { data } = await api.post<User>("/users/empleados/", payload);
    return data;
  },

  update: async (id: number, payload: Partial<UserPayload>) => {
    const { data } = await api.patch<User>(`/users/empleados/${id}/`, payload);
    return data;
  },

  delete: async (id: number) => {
    await api.delete(`/users/empleados/${id}/`);
  },

  getRoles: async () => {
    const { data } = await api.get<Role[]>("/users/roles/");
    return data;
  },

  getVenueOptions: async () => {
    const { data } = await api.get<BranchModalityOption[]>(
      "/core/sucursales-modalidades/",
    );
    return data;
  },
};
