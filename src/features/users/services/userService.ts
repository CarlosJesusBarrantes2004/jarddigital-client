// ─────────────────────────────────────────────
// Users — Service
// ─────────────────────────────────────────────

import { api } from "@/api/axios";

import type {
  CreateUserPayload,
  Role,
  SupervisorAssignmentPayload,
  UpdateUserPayload,
  User,
  UserFilters,
  UserWorkspace,
  WorkspaceOption,
} from "../types";

// ── Normalización ─────────────────────────────

interface RawBranch {
  id_modalidad_sede: number;
  id_sucursal: number;
  nombre_sucursal: string;
  id_modalidad: number;
  nombre_modalidad: string;
}

interface RawUser extends Omit<User, "sucursales"> {
  sucursales: RawBranch[];
}

function normalizeUser(raw: RawUser): User {
  const sucursales: UserWorkspace[] = (raw.sucursales ?? []).map((b) => ({
    id_modalidad_sede: b.id_modalidad_sede,
    id_sucursal: b.id_sucursal,
    nombre_sucursal: b.nombre_sucursal,
    id_modalidad: b.id_modalidad,
    nombre_modalidad: b.nombre_modalidad,
    etiqueta: `${b.nombre_sucursal} · ${b.nombre_modalidad}`,
  }));

  return { ...raw, sucursales };
}

// ── Servicio ──────────────────────────────────

export const userService = {
  /** Lista de usuarios con filtros opcionales */
  // Tu propio código en userService.ts:
  getAll: async (filters?: UserFilters): Promise<User[]> => {
    const params = new URLSearchParams();
    if (filters?.search) params.append("search", filters.search);
    if (filters?.id_rol) params.append("id_rol", String(filters.id_rol));

    // 👇 ¡ESTA ES LA MAGIA QUE YA TENÍAS ESCRITA! 👇
    if (filters?.id_modalidad_sede)
      params.append("id_modalidad_sede", String(filters.id_modalidad_sede));

    const { data } = await api.get<RawUser[]>(`/users/empleados/?${params}`);
    return data.map(normalizeUser);
  },

  getById: async (id: number): Promise<User> => {
    const { data } = await api.get<RawUser>(`/users/empleados/${id}/`);
    return normalizeUser(data);
  },

  create: async (payload: CreateUserPayload): Promise<User> => {
    const { data } = await api.post<RawUser>("/users/empleados/", payload);
    return normalizeUser(data);
  },

  update: async (id: number, payload: UpdateUserPayload): Promise<User> => {
    const { data } = await api.patch<RawUser>(
      `/users/empleados/${id}/`,
      payload,
    );
    return normalizeUser(data);
  },

  deactivate: async (id: number): Promise<void> => {
    await api.delete(`/users/empleados/${id}/`);
  },

  getRoles: async (): Promise<Role[]> => {
    const { data } = await api.get<Role[]>("/users/roles/");
    return data;
  },

  /** Todas las combinaciones sede×modalidad disponibles para asignar */
  getWorkspaceOptions: async (): Promise<WorkspaceOption[]> => {
    const { data } = await api.get<WorkspaceOption[]>(
      "/core/sucursales-modalidades/",
    );
    return data;
  },

  assignSupervisor: async (payload: SupervisorAssignmentPayload) => {
    const { data } = await api.post("/users/asignaciones-supervisor/", payload);
    return data;
  },
};
