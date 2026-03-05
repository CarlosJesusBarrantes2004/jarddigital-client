import { Edit2, Trash2, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "../../types";

// Reutilizamos la paleta de colores de roles para coherencia visual en todo el sistema
const ROLE_META: Record<string, { bg: string; color: string }> = {
  DUENO: {
    bg: "bg-destructive/15 dark:bg-destructive/20",
    color: "text-destructive dark:text-red-400",
  },
  SUPERVISOR: {
    bg: "bg-blue-500/15 dark:bg-blue-500/20",
    color: "text-blue-600 dark:text-blue-400",
  },
  RRHH: {
    bg: "bg-amber-500/15 dark:bg-amber-500/20",
    color: "text-amber-600 dark:text-amber-400",
  },
  BACKOFFICE: {
    bg: "bg-purple-500/15 dark:bg-purple-500/20",
    color: "text-purple-600 dark:text-purple-400",
  },
  ASESOR: {
    bg: "bg-emerald-500/15 dark:bg-emerald-500/20",
    color: "text-emerald-600 dark:text-emerald-400",
  },
};

function getRoleMeta(codigo: string) {
  return (
    ROLE_META[codigo] ?? { bg: "bg-muted/50", color: "text-muted-foreground" }
  );
}

interface RolesTableProps {
  roles: Role[];
  onEdit: (role: Role) => void;
  onDelete: (id: number) => void;
}

export function RolesTable({ roles, onEdit, onDelete }: RolesTableProps) {
  if (roles.length === 0) {
    return (
      <div className="py-16 text-center flex flex-col items-center justify-center text-muted-foreground bg-card">
        <ShieldAlert size={32} className="mb-3 opacity-50" />
        <p className="text-sm font-medium">
          No hay roles registrados en el sistema.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left font-sans">
        <thead className="bg-muted/50 border-b border-border">
          <tr>
            <th className="px-6 py-3.5 text-left font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground whitespace-nowrap">
              Código / Nombre
            </th>
            <th className="px-6 py-3.5 text-left font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground whitespace-nowrap hidden sm:table-cell">
              Descripción
            </th>
            <th className="px-6 py-3.5 text-center font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground whitespace-nowrap">
              Jerarquía
            </th>
            <th className="px-6 py-3.5 text-left font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground whitespace-nowrap">
              Estado
            </th>
            <th className="px-6 py-3.5 text-center font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground whitespace-nowrap w-24">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {roles.map((rol) => {
            const meta = getRoleMeta(rol.codigo);
            return (
              <tr
                key={rol.id}
                className="hover:bg-muted/30 transition-colors group bg-card"
              >
                <td className="px-6 py-4 align-middle">
                  <div className="flex flex-col gap-1 items-start">
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest font-mono",
                        meta.bg,
                        meta.color,
                      )}
                    >
                      {rol.codigo}
                    </span>
                    <span className="font-semibold text-[13px] text-foreground tracking-tight">
                      {rol.nombre}
                    </span>
                  </div>
                </td>

                <td className="px-6 py-4 align-middle hidden sm:table-cell">
                  <p className="text-[12px] text-muted-foreground max-w-[200px] lg:max-w-xs truncate font-light">
                    {(rol as any).descripcion || "Sin descripción detallada"}
                  </p>
                </td>

                <td className="px-6 py-4 align-middle text-center">
                  <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary font-mono text-[12px] font-bold border border-primary/20">
                    {rol.nivel_jerarquia}
                  </div>
                </td>

                <td className="px-6 py-4 align-middle">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "w-1.5 h-1.5 rounded-full shrink-0",
                        rol.activo
                          ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                          : "bg-muted-foreground/40",
                      )}
                    />
                    <span
                      className={cn(
                        "text-[11px] font-semibold uppercase tracking-widest",
                        rol.activo
                          ? "text-foreground/80"
                          : "text-muted-foreground",
                      )}
                    >
                      {rol.activo ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                </td>

                <td className="px-6 py-4 align-middle text-center">
                  <div className="flex justify-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => onEdit(rol)}
                      title="Editar"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-blue-500/10 hover:text-blue-500 hover:border-blue-500/30 border border-transparent transition-all"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(rol.id)}
                      title="Desactivar"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 border border-transparent transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
