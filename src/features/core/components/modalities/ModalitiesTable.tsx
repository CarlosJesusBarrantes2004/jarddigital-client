import { Edit2, Trash2, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Modality } from "../../types";

interface ModalitiesTableProps {
  modalities: Modality[];
  onEdit: (modality: Modality) => void;
  onDelete: (id: number) => void;
}

export function ModalitiesTable({
  modalities,
  onEdit,
  onDelete,
}: ModalitiesTableProps) {
  if (modalities.length === 0) {
    return (
      <div className="py-16 text-center flex flex-col items-center justify-center text-muted-foreground bg-card">
        <Smartphone size={32} className="mb-3 opacity-50" />
        <p className="text-sm font-medium">
          No se encontraron modalidades operativas.
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
              Modalidad Operativa
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
          {modalities.map((modalidad) => (
            <tr
              key={modalidad.id}
              className="hover:bg-muted/30 transition-colors group bg-card"
            >
              <td className="px-6 py-4 align-middle">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 transition-colors">
                    <Smartphone size={16} />
                  </div>
                  <span className="font-semibold text-[14px] text-foreground tracking-tight uppercase font-mono">
                    {modalidad.nombre}
                  </span>
                </div>
              </td>

              <td className="px-6 py-4 align-middle">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-1.5 h-1.5 rounded-full shrink-0",
                      modalidad.activo
                        ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                        : "bg-muted-foreground/40",
                    )}
                  />
                  <span
                    className={cn(
                      "text-[11px] font-semibold uppercase tracking-widest",
                      modalidad.activo
                        ? "text-foreground/80"
                        : "text-muted-foreground",
                    )}
                  >
                    {modalidad.activo ? "Activa" : "Inactiva"}
                  </span>
                </div>
              </td>

              <td className="px-6 py-4 align-middle text-center">
                <div className="flex justify-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => onEdit(modalidad)}
                    title="Editar"
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-blue-500/10 hover:text-blue-500 hover:border-blue-500/30 border border-transparent transition-all"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(modalidad.id)}
                    title="Desactivar"
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 border border-transparent transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
