export interface BranchModality {
  id: number;
  nombre: string;
}

export interface Branch {
  id: number;
  nombre: string;
  direccion: string;
  activo: boolean;
  creado_en: string;
  modalidades: BranchModality[];
}

export interface BranchPayload {
  nombre: string;
  direccion: string;
  activo: boolean;
  ids_modalidades: number[];
}

export interface RolePayload {
  codigo: string;
  nombre: string;
  descripcion?: string;
  nivel_jerarquia: number;
  activo: boolean;
}
