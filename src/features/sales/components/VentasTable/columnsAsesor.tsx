/**
 * features/sales/components/VentasTable/columnsAsesor.tsx
 *
 * Fixes incluidos:
 *   #2 — Badge "En corrección" solo si solicitud_correccion sigue true
 *   #3 — Botón Editar solo cuando el asesor tiene permiso real de edición
 *   #4 — Botón Eliminar solo en pendientes o en corrección
 *   #4b — Sub-estado debajo de EJECUCION
 *   #6 — Tooltip con motivo de rechazo al pasar el cursor sobre venta rechazada
 *   #8 — Botón Reingresar oculto si ya_reingresada = true
 */
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Pencil,
  AlertTriangle,
  RefreshCw,
  Trash2,
  MessageCircle,
} from "lucide-react";
import { EstadoBadge } from "../EstadoBadge";
import type { Venta, EstadoSOT } from "../../types/sales.types";
import { ActionBtn } from "@/components/ActionBtn";

export function buildColumnsAsesor(
  estadosSOT: EstadoSOT[],
  onEditar: (v: Venta) => void,
  onReingresar: (v: Venta) => void,
  onEliminar: (v: Venta) => void,
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
      cell: ({ row }) => {
        const v = row.original;
        return (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium text-[13px] text-foreground leading-snug">
                {v.cliente_nombre}
              </p>
              {v.venta_origen && (
                <span className="inline-flex items-center gap-1 text-[9px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded-full border border-primary/20 uppercase tracking-widest shrink-0">
                  <RefreshCw size={9} /> Reingreso
                </span>
              )}
            </div>
            <p className="font-mono text-[11px] text-muted-foreground">
              {v.cliente_numero_doc}
            </p>
          </div>
        );
      },
    },
    {
      id: "producto",
      header: "Plan / Producto",
      cell: ({ row }) => {
        const v = row.original;
        const nombre =
          [v.producto_campana, v.producto_solucion, v.producto_paquete]
            .filter(Boolean)
            .join(" - ") || "Producto sin nombre";
        return (
          <div className="flex flex-col items-start gap-1">
            <p
              className="text-[13px] font-medium text-foreground/80 leading-tight line-clamp-2"
              title={nombre}
            >
              {nombre}
            </p>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary uppercase tracking-widest">
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
        const codigoEstado = estadoData?.codigo?.toUpperCase() ?? "";
        const esRechazada = codigoEstado === "RECHAZADO";
        const esEjecucion = codigoEstado === "EJECUCION";

        // FIX #4b: Sub-estado solo bajo EJECUCION
        const tieneSubEstado = esEjecucion && v.id_sub_estado_sot !== null;

        return (
          <div className="flex flex-col gap-1.5 items-start">
            {/* FIX #6: Badge de rechazada con tooltip de motivo */}
            {esRechazada && v.comentario_gestion ? (
              <div className="relative group/tooltip">
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
                {/* Icono indicador de que hay motivo */}
                <MessageCircle
                  size={11}
                  className="absolute -top-1 -right-1 text-destructive bg-background rounded-full"
                />
                {/* Tooltip con motivo */}
                <div className="absolute bottom-full left-0 mb-2 z-50 hidden group-hover/tooltip:block w-56 pointer-events-none">
                  <div className="bg-card border border-destructive/30 rounded-xl shadow-xl p-3">
                    <p className="text-[10px] font-mono font-bold text-destructive uppercase tracking-widest mb-1.5">
                      Motivo del rechazo
                    </p>
                    <p className="text-[11px] text-foreground/80 leading-snug">
                      {v.comentario_gestion}
                    </p>
                  </div>
                  {/* Flechita del tooltip */}
                  <div className="w-2.5 h-2.5 bg-card border-b border-r border-destructive/30 rotate-45 ml-3 -mt-1.5" />
                </div>
              </div>
            ) : (
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
            )}

            {/*
             * FIX #2: El badge solo aparece si solicitud_correccion === true.
             */}
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

            {/* FIX #4b: Sub-estado bajo EJECUCION */}
            {tieneSubEstado && v.nombre_sub_estado && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20 max-w-[180px] truncate">
                {v.nombre_sub_estado}
              </span>
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
        const esEjecucion = v.codigo_estado?.toUpperCase() === "EJECUCION";
        const esPendiente = v.id_estado_sot === null && !v.solicitud_correccion;

        const tieneAudios = Array.isArray(v.audios) && v.audios.length > 0;
        const puedeEditar =
          !esRechazada &&
          (v.solicitud_correccion ||
            esPendiente ||
            (esEjecucion && !tieneAudios));

        const puedeEliminar = esPendiente || v.solicitud_correccion;

        const yaReingresada = !!(v as Venta & { ya_reingresada?: boolean })
          .ya_reingresada;

        return (
          <div className="flex items-center gap-1.5 flex-wrap">
            {puedeEditar && (
              <ActionBtn
                onClick={() => onEditar(v)}
                variant="primary"
                title={
                  v.solicitud_correccion
                    ? "Corregir según indicaciones del Backoffice"
                    : esEjecucion
                      ? "Subir audios pendientes"
                      : "Editar venta"
                }
              >
                <Pencil size={12} /> Editar
              </ActionBtn>
            )}

            {/* Rechazada sin permiso */}
            {esRechazada && !v.permitir_reingreso && (
              <span className="text-[10px] font-mono text-destructive/50 uppercase tracking-widest px-1">
                Rechazada
              </span>
            )}

            {/* FIX #8: Reingresar — solo si tiene permiso Y no fue reingresada */}
            {esRechazada && v.permitir_reingreso && !yaReingresada && (
              <ActionBtn
                onClick={() => onReingresar(v)}
                variant="primary"
                title="Crear nuevo reingreso con estos datos"
              >
                <RefreshCw size={12} /> Reingresar
              </ActionBtn>
            )}

            {/* Si ya fue reingresada: chip informativo en lugar del botón */}
            {esRechazada && v.permitir_reingreso && yaReingresada && (
              <span className="inline-flex items-center gap-1 text-[9px] font-mono text-primary/60 bg-primary/5 px-2 py-1 rounded-full border border-primary/15 uppercase tracking-widest whitespace-nowrap">
                <RefreshCw size={8} /> Ya reingresada
              </span>
            )}

            {/* FIX #4: Papelera */}
            {puedeEliminar && (
              <ActionBtn
                onClick={() => onEliminar(v)}
                variant="warning"
                title="Eliminar venta (solo pendientes o en corrección)"
              >
                <Trash2 size={12} />
              </ActionBtn>
            )}
          </div>
        );
      },
      size: 160,
    },
  ];
}
