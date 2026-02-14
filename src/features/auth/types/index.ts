export interface Role {
  codigo: string;
  nombre: string;
  nivel_jerarquia: number;
}

export interface Branch {
  id: number;
  nombre: string;
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
