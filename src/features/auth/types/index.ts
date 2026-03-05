import type { RoleCode, Role } from "@/features/core/types";

export type { RoleCode, Role };

export interface Workspace {
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
  rol: Role;
  sucursales: Workspace[];
  activo: boolean;
}

export interface ActiveWorkspace {
  id_modalidad_sede: number;
  id_sucursal: number;
  nombre_sucursal: string;
  id_modalidad: number;
  nombre_modalidad: string;
  etiqueta: string;
}
