export interface Role {
  codigo: string;
  nombre: string;
  nivel_jerarquia: number;
}

export interface User {
  id: number;
  username: string;
  nombre_completo: string;
  email: string;
  rol: Role;
  activo: boolean;
}
