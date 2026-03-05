import { api } from "@/api/axios";
import type { User, Workspace } from "../types";

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
  const workspaces: Workspace[] = (raw.sucursales ?? []).map((b) => ({
    // ↓ ESTO ES VITAL ↓
    id_modalidad_sede: b.id_modalidad_sede,
    id_sucursal: b.id_sucursal,
    nombre_sucursal: b.nombre_sucursal,
    id_modalidad: b.id_modalidad,
    nombre_modalidad: b.nombre_modalidad,
    etiqueta: `${b.nombre_sucursal} - ${b.nombre_modalidad}`,
  }));

  return { ...raw, sucursales: workspaces };
}

export const authService = {
  login: async (credentials: { username: string; password: string }) => {
    const { data } = await api.post("/token/", credentials);
    return data;
  },

  getUserProfile: async (): Promise<User> => {
    const { data } = await api.get<RawUser>("/users/me/");
    return normalizeUser(data);
  },

  logout: async () => {
    await api.post("/users/logout/");
  },
};
