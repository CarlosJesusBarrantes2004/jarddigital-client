import type {
  User as AuthUser,
  Role,
  Branch as AuthBranch,
} from "@/features/auth/types";

export type { Role };

export interface AdminBranch extends AuthBranch {
  id_modalidad_sede: number;
}

export interface User extends Omit<AuthUser, "rol" | "sucursales"> {
  id_rol: number;
  sucursales: AdminBranch[];
}

export interface UserPayload {
  username: string;
  nombre_completo: string;
  email: string;
  id_rol: number;
  ids_modalidades_sede: number[];
  activo?: boolean;
  password?: string;
}

export interface UserFilters {
  search?: string;
  id_rol?: number;
}

export interface BranchModalityOption {
  id: number;
  etiqueta: string;
}
