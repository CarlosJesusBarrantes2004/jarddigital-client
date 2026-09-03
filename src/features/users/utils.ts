import type { User } from "./types";

export function esUsuarioDueno(
  user: Pick<User, "rol" | "id_rol"> | null | undefined,
): boolean {
  if (!user) return false;
  if (user.rol?.codigo === "DUENO") return true;
  return user.id_rol === 1;
}
