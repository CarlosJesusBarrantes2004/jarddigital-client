import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Pencil, AlertTriangle } from "lucide-react";
import { EstadoBadge } from "../EstadoBadge";
import { cn } from "@/lib/utils";
import type { Venta, EstadoSOT } from "../../types/sales.types";

function ActionBtn({
  onClick,
  title,
  variant = "default",
  children,
}: {
  onClick: () => void;
  title?: string;
  variant?: "default" | "primary" | "warning";
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold font-sans transition-all duration-200 tracking-wider uppercase",
        variant === "default" &&
          "bg-transparent border-border text-muted-foreground hover:bg-muted hover:text-foreground",
        variant === "primary" &&
          "bg-primary/10 border-primary/30 text-primary hover:bg-primary/20",
        variant === "warning" &&
          "bg-orange-500/10 border-orange-500/30 text-orange-500 hover:bg-orange-500/20",
      )}
    >
      {children}
    </button>
  );
}

export function buildColumnsAsesor(
  estadosSOT: EstadoSOT[],
  onEditar: (v: Venta) => void,
): ColumnDef<Venta>[] {
  return [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => (
        <span className="font-mono text-[11px] text-muted-foreground/60">
          #{row.original.id}
        </span>
      ),
      size: 60,
    },
    {
      accessorKey: "cliente_nombre",
      header: "Cliente",
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <p className="font-medium text-[13px] text-foreground leading-snug">
            {row.original.cliente_nombre}
          </p>
          <p className="font-mono text-[11px] text-muted-foreground">
            {row.original.cliente_numero_doc}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "nombre_producto",
      header: "Plan",
      cell: ({ row }) => (
        <div className="flex flex-col items-start gap-1">
          <p className="text-[13px] font-medium text-foreground/80">
            {row.original.nombre_producto}
          </p>
          <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary uppercase tracking-widest">
            {row.original.tecnologia}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "id_estado_sot",
      header: "Estado",
      cell: ({ row }) => {
        const v = row.original;
        const estadoData = estadosSOT.find((e) => e.id === v.id_estado_sot);

        return (
          <div className="flex flex-col gap-1.5 items-start">
            <EstadoBadge
              estado={
                estadoData
                  ? {
                      nombre: estadoData.nombre,
                      codigo: estadoData.codigo,
                      color_hex: estadoData.color_hex,
                    }
                  : null
              }
            />
            {v.solicitud_correccion && (
              <div className="flex items-start gap-1.5 px-2 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 max-w-[200px]">
                <AlertTriangle
                  size={12}
                  className="text-orange-500 shrink-0 mt-0.5"
                />
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider leading-none">
                    En corrección
                  </span>
                  {v.comentario_gestion && (
                    <span className="text-[10px] text-orange-600/70 dark:text-orange-400/70 mt-1 line-clamp-2 leading-tight">
                      {v.comentario_gestion}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: "codigos",
      header: "SOT / SEC",
      cell: ({ row }) => {
        const v = row.original;
        return (
          <div className="flex flex-col gap-0.5">
            {v.codigo_sot && (
              <span className="font-mono text-[11px] text-foreground/70">
                {v.codigo_sot}
              </span>
            )}
            {v.codigo_sec && (
              <span className="font-mono text-[10px] text-muted-foreground">
                {v.codigo_sec}
              </span>
            )}
            {!v.codigo_sot && !v.codigo_sec && (
              <span className="text-[10px] text-muted-foreground/40">—</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "fecha_visita_programada",
      header: "Visita",
      cell: ({ row }) => {
        // Extraemos el string de la fecha que llega del backend ("YYYY-MM-DD")
        const fechaStr = row.original.fecha_visita_programada;

        return fechaStr ? (
          <span className="text-[13px] text-foreground/80">
            {format(
              // EL PARCHE CRÍTICO: Añadimos T00:00:00 para forzar el Timezone Local
              new Date(`${fechaStr}T00:00:00`),
              "dd MMM yyyy",
              { locale: es },
            )}
          </span>
        ) : (
          <span className="text-[10px] text-muted-foreground/40">
            Sin programar
          </span>
        );
      },
    },
    {
      accessorKey: "fecha_creacion",
      header: "Creada",
      cell: ({ row }) => (
        <span className="font-mono text-[10px] text-muted-foreground">
          {format(new Date(row.original.fecha_creacion), "dd/MM/yy HH:mm")}
        </span>
      ),
    },
    {
      id: "acciones",
      header: "",
      cell: ({ row }) => {
        const v = row.original;
        const puedeEditar = v.solicitud_correccion;
        const esRechazada = v.codigo_estado?.toUpperCase() === "RECHAZADO";

        if (!puedeEditar && !esRechazada) return null;

        return (
          <div className="flex gap-1.5">
            {puedeEditar && (
              <ActionBtn
                onClick={() => onEditar(v)}
                variant="warning"
                title="Corregir venta según indicación"
              >
                <Pencil size={12} /> Corregir
              </ActionBtn>
            )}
            {esRechazada && !puedeEditar && (
              <span className="text-[10px] font-mono text-destructive/60 uppercase tracking-widest">
                Rechazada
              </span>
            )}
          </div>
        );
      },
      size: 120,
    },
  ];
}
