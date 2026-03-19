import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Pencil, AlertTriangle, RefreshCw } from "lucide-react";
import { EstadoBadge } from "../EstadoBadge";
import type { Venta, EstadoSOT } from "../../types/sales.types";
import { ActionBtn } from "@/components/ActionBtn";

export function buildColumnsAsesor(
  estadosSOT: EstadoSOT[],
  onEditar: (v: Venta) => void,
  onReingresar: (v: Venta) => void,
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
          <div className="flex items-center gap-2">
            <p className="font-medium text-[13px] text-foreground leading-snug">
              {row.original.cliente_nombre}
            </p>
            {row.original.venta_origen && (
              <span className="inline-flex items-center gap-1 text-[9px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded-full border border-primary/20 uppercase tracking-widest">
                <RefreshCw size={9} /> Reingreso
              </span>
            )}
          </div>
          <p className="font-mono text-[11px] text-muted-foreground">
            {row.original.cliente_numero_doc}
          </p>
        </div>
      ),
    },
    {
      id: "producto",
      header: "Plan / Producto",
      cell: ({ row }) => {
        const v = row.original;
        const nombreCompletoPlan =
          [v.producto_campana, v.producto_solucion, v.producto_paquete]
            .filter(Boolean)
            .join(" - ") || "Producto sin nombre";

        return (
          <div className="flex flex-col items-start gap-1">
            <p
              className="text-[13px] font-medium text-foreground/80 leading-tight line-clamp-2"
              title={nombreCompletoPlan}
            >
              {nombreCompletoPlan}
            </p>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary uppercase tracking-widest mt-0.5">
              {v.tecnologia}
            </span>
          </div>
        );
      },
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
        const fechaStr = row.original.fecha_visita_programada;

        return fechaStr ? (
          <span className="text-[13px] text-foreground/80">
            {format(new Date(`${fechaStr}T00:00:00`), "dd MMM yyyy", {
              locale: es,
            })}
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
        const esRechazada = v.codigo_estado?.toUpperCase() === "RECHAZADO";

        return (
          <div className="flex gap-1.5">
            {/* Si NO está rechazada (o si está rechazada pero NO tiene permiso), se muestra Editar */}
            {!esRechazada && (
              <ActionBtn
                onClick={() => onEditar(v)}
                variant="primary"
                title="Editar Venta o subir audios faltantes"
              >
                <Pencil size={12} /> Editar
              </ActionBtn>
            )}

            {/* 👇 SOLO APARECE SI ES RECHAZADA Y TIENE EL PERMISO */}
            {esRechazada && v.permitir_reingreso && (
              <ActionBtn
                onClick={() => onReingresar(v)}
                variant="primary"
                title="Crear nueva venta con estos datos"
              >
                <RefreshCw size={12} /> Reingresar
              </ActionBtn>
            )}

            {esRechazada && !v.permitir_reingreso && (
              <span className="text-[10px] font-mono text-destructive/60 uppercase tracking-widest px-2">
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
