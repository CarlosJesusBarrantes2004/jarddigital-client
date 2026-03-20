/**
 * features/users/services/userService.ts
 *
 * FIX #7 — Cambios:
 *   1. `getAll` ahora acepta `activo?: boolean` en los filtros y lo manda al backend
 *   2. `reactivate(id)` — nuevo método que hace PATCH { activo: true }
 */
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

// ── Normalización ─────────────────────────────────────────────────────────────
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

// ── Servicio ──────────────────────────────────────────────────────────────────
export const userService = {
  /**
   * Lista de usuarios con filtros opcionales.
   * FIX #7: Ahora pasa activo=true/false al backend para separar activos de inactivos.
   */
  getAll: async (
    filters?: UserFilters & { activo?: boolean },
  ): Promise<User[]> => {
    const params = new URLSearchParams();
    if (filters?.search) params.append("search", filters.search);
    if (filters?.id_rol) params.append("id_rol", String(filters.id_rol));
    if (filters?.id_modalidad_sede)
      params.append("id_modalidad_sede", String(filters.id_modalidad_sede));

    // FIX #7: filtro explícito de activo
    if (filters?.activo !== undefined)
      params.append("activo", String(filters.activo));

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

  /**
   * FIX #7: Reactivar un colaborador que fue desactivado.
   * Hace PATCH { activo: true } sobre el mismo endpoint de edición.
   * El signal gestionar_grabador_automatico en signals.py re-crea o reactiva
   * su entrada en la tabla grabadores_audio automáticamente.
   */
  reactivate: async (id: number): Promise<User> => {
    const { data } = await api.patch<RawUser>(
      `/users/empleados/${id}/reactivar/`,
    );
    return normalizeUser(data);
  },

  getRoles: async (): Promise<Role[]> => {
    const { data } = await api.get<Role[]>("/users/roles/");
    return data;
  },

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
