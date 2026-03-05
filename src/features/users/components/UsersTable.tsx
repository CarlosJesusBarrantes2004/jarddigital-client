import { Edit2, Trash2, Users as UsersIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role, User } from "../types";

// ── Role pill metadata (Versión Tailwind Semántica) ──
const ROLE_META: Record<string, { label: string; bg: string; color: string }> =
  {
    DUENO: {
      label: "Dueño",
      bg: "bg-destructive/15 dark:bg-destructive/20",
      color: "text-destructive dark:text-red-400",
    },
    SUPERVISOR: {
      label: "Supervisor",
      bg: "bg-blue-500/15 dark:bg-blue-500/20",
      color: "text-blue-600 dark:text-blue-400",
    },
    RRHH: {
      label: "RRHH",
      bg: "bg-amber-500/15 dark:bg-amber-500/20",
      color: "text-amber-600 dark:text-amber-400",
    },
    BACKOFFICE: {
      label: "BackOffice",
      bg: "bg-purple-500/15 dark:bg-purple-500/20",
      color: "text-purple-600 dark:text-purple-400",
    },
    ASESOR: {
      label: "Asesor",
      bg: "bg-emerald-500/15 dark:bg-emerald-500/20",
      color: "text-emerald-600 dark:text-emerald-400",
    },
  };

function getRoleMeta(roles: Role[], idRol: number) {
  if (idRol === 1) return ROLE_META.DUENO;

  const role = roles.find((r) => r.id === idRol);

  if (!role)
    return {
      label: "Sin rol",
      bg: "bg-muted/50",
      color: "text-muted-foreground",
    };

  return (
    ROLE_META[role.codigo] ?? {
      label: role.nombre,
      bg: "bg-muted/50",
      color: "text-muted-foreground",
    }
  );
}

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(" ").filter(Boolean);
  const init =
    parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();
  return <>{init}</>;
}

interface UsersTableProps {
  users: User[];
  roles: Role[];
  onEdit: (user: User) => void;
  onDelete: (id: number) => void;
  isLoading: boolean;
}

export const UsersTable = ({
  users,
  roles,
  onEdit,
  onDelete,
  isLoading,
}: UsersTableProps) => {
  return (
    <div className="font-sans">
      {/* ── Desktop: tabla ── */}
      <div className="hidden md:block w-full overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-left font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                Colaborador
              </th>
              <th className="px-4 py-3 text-left font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                Rol
              </th>
              <th className="px-4 py-3 text-left font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                Sedes
              </th>
              <th className="px-4 py-3 text-left font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                Estado
              </th>
              <th className="px-4 py-3 text-center font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground whitespace-nowrap w-20">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <td key={j} className="px-4 py-3.5 align-middle">
                      <div className="h-[18px] bg-muted animate-pulse rounded-md w-full max-w-[120px]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-12 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center gap-3 opacity-60">
                    <UsersIcon size={32} />
                    <p className="text-sm font-medium">
                      No se encontraron colaboradores
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const roleMeta = getRoleMeta(roles, user.id_rol);
                const ws = user.sucursales ?? [];
                const wsVisible = ws.slice(0, 2);
                const wsExtra = ws.length - 2;

                return (
                  <tr
                    key={user.id}
                    className="transition-colors hover:bg-muted/30 group"
                  >
                    <td className="px-4 py-3.5 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-[11px] font-bold text-primary shrink-0">
                          <Initials name={user.nombre_completo} />
                        </div>
                        <div>
                          <span className="block text-[14px] font-medium text-foreground leading-snug">
                            {user.nombre_completo}
                          </span>
                          <span className="block text-[11px] text-muted-foreground font-mono">
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 align-middle">
                      <span
                        className={cn(
                          "inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap",
                          roleMeta.bg,
                          roleMeta.color,
                        )}
                      >
                        {roleMeta.label}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 align-middle">
                      <div className="flex flex-wrap gap-1.5">
                        {wsVisible.map((s) => (
                          <span
                            key={s.id_modalidad_sede}
                            className="px-2 py-0.5 rounded-md bg-muted border border-border text-[11px] text-muted-foreground font-mono whitespace-nowrap"
                          >
                            {/* Como la sucursal del user ahora solo trae id_modalidad_sede, idealmente la api te manda etiqueta. Si no la manda, usamos lo que haya. */}
                            {s.etiqueta ||
                              `${s.nombre_sucursal} · ${s.nombre_modalidad}`}
                          </span>
                        ))}
                        {wsExtra > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary text-[11px] font-mono font-medium">
                            +{wsExtra}
                          </span>
                        )}
                        {ws.length === 0 && (
                          <span className="text-[11px] text-muted-foreground/50 italic">
                            Sin sede
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 align-middle">
                      <div className="flex items-center gap-1.5">
                        <div
                          className={cn(
                            "w-1.5 h-1.5 rounded-full shrink-0",
                            user.activo
                              ? "bg-emerald-500"
                              : "bg-muted-foreground/30",
                          )}
                        />
                        <span
                          className={cn(
                            "text-[12px] font-medium",
                            user.activo
                              ? "text-foreground/80"
                              : "text-muted-foreground",
                          )}
                        >
                          {user.activo ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                    </td>

                    {user.id_rol !== 1 ? (
                      <td className="px-4 py-3.5 align-middle">
                        <div className="flex justify-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => onEdit(user)}
                            title="Editar"
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-blue-500/10 hover:text-blue-500 hover:border-blue-500/30 border border-transparent transition-all"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(user.id)}
                            title="Desactivar"
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 border border-transparent transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Mobile: cards ── */}
      <div className="md:hidden flex flex-col gap-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-[90px] bg-card border border-border rounded-2xl animate-pulse"
            />
          ))
        ) : users.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">
            <UsersIcon size={32} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium">
              No se encontraron colaboradores
            </p>
          </div>
        ) : (
          users.map((user) => {
            const roleMeta = getRoleMeta(roles, user.id_rol);
            const ws = user.sucursales ?? [];
            return (
              <div
                key={user.id}
                className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3 shadow-sm animate-in fade-in duration-300"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-[12px] font-bold text-primary shrink-0">
                      <Initials name={user.nombre_completo} />
                    </div>
                    <div>
                      <span className="block text-[14px] font-medium text-foreground leading-tight">
                        {user.nombre_completo}
                      </span>
                      <span className="block text-[11px] text-muted-foreground font-mono mt-0.5">
                        {user.email}
                      </span>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider",
                      roleMeta.bg,
                      roleMeta.color,
                    )}
                  >
                    {roleMeta.label}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {ws.map((s) => (
                    <span
                      key={s.id_modalidad_sede}
                      className="px-2 py-0.5 rounded-md bg-muted border border-border text-[10px] text-muted-foreground font-mono"
                    >
                      {s.etiqueta ||
                        `${s.nombre_sucursal} · ${s.nombre_modalidad}`}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1 mt-1 border-t border-border">
                  <div className="flex items-center gap-1.5">
                    <div
                      className={cn(
                        "w-1.5 h-1.5 rounded-full shrink-0",
                        user.activo
                          ? "bg-emerald-500"
                          : "bg-muted-foreground/30",
                      )}
                    />
                    <span
                      className={cn(
                        "text-[11px] font-medium uppercase tracking-widest",
                        user.activo
                          ? "text-foreground/80"
                          : "text-muted-foreground",
                      )}
                    >
                      {user.activo ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(user)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-muted text-foreground hover:bg-blue-500/10 hover:text-blue-500 transition-colors"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(user.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-muted text-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
