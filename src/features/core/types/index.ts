export interface Modality {
  id: number;
  nombre: string;
  activo: boolean;
}

export interface Branch {
  id: number;
  nombre: string;
  direccion: string;
  activo: boolean;
  creado_en: string;
  modalidades: Modality[];
}

export type RoleCode =
  | "DUENO"
  | "SUPERVISOR"
  | "RRHH"
  | "BACKOFFICE"
  | "ASESOR";

export interface Role {
  id: number;
  codigo: RoleCode;
  nombre: string;
  descripcion: string | null;
  nivel_jerarquia: number;
  activo: boolean;
}

export interface ModalityPayload {
  nombre: string;
  activo: boolean;
}

export interface BranchPayload {
  nombre: string;
  direccion: string;
  activo: boolean;
  ids_modalidades: number[];
}

export interface RolePayload {
  codigo: RoleCode;
  nombre: string;
  descripcion?: string;
  nivel_jerarquia: number;
  activo: boolean;
}

export interface Departament {
  id: number;
  codigo_ubigeo: string;
  nombre: string;
}

export interface Province {
  id: number;
  id_departamento: number;
  codigo_ubigeo: string;
  nombre: string;
}

export interface District {
  id: number;
  id_provincia: number;
  codigo_ubigeo: string;
  nombre: string;
}
