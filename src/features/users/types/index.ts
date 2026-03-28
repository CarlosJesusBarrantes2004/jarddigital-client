import type { RoleCode } from "@/features/auth/types";

export type { RoleCode };

export interface Role {
  id: number;
  codigo: RoleCode;
  nombre: string;
  nivel_jerarquia: number;
  activo: boolean;
}

export interface UserWorkspace {
  id_modalidad_sede: number;
  id_sucursal: number;
  nombre_sucursal: string;
  id_modalidad: number;
  nombre_modalidad: string;
  etiqueta: string;
}

export interface User {
  id: number;
  username: string;
  nombre_completo: string;
  email: string;
  celular?: string | null;
  id_rol: number;
  rol?: Role;
  sucursales: UserWorkspace[];
  activo: boolean;
}

export interface CreateUserPayload {
  username: string;
  nombre_completo: string;
  email: string;
  password: string;
  id_rol: number;
  celular?: string | null;
  ids_modalidades_sede?: number[];
  activo?: boolean;
}

export interface UpdateUserPayload {
  nombre_completo?: string;
  email?: string;
  password?: string;
  id_rol?: number;
  celular?: string | null;
  ids_modalidades_sede?: number[];
  activo?: boolean;
}

export interface SupervisorAssignmentPayload {
  id_supervisor: number;
  id_modalidad_sede: number;
  fecha_inicio: string;
  activo: boolean;
}

export interface UserFilters {
  search?: string;
  id_rol?: number;
  id_modalidad_sede?: number;
  activo?: boolean;
}

export interface WorkspaceOption {
  id: number;
  etiqueta: string;
}
