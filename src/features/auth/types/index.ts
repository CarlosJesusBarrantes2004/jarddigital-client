export type role_code =
  | "DUENO"
  | "SUPERVISOR"
  | "RRHH"
  | "BACKOFFICE"
  | "ASESOR";

export interface Role {
  id: number;
  codigo: role_code;
  nombre: string;
  nivel_jerarquia: number;
  activo: boolean;
}

export interface Branch {
  id_sucursal: number;
  nombre_sucursal: string;
  id_modalidad: number;
  nombre_modalidad: string;
}

export interface User {
  id: number;
  username: string;
  nombre_completo: string;
  email: string;
  rol: Role;
  sucursales: Branch[];
  activo: boolean;
}
