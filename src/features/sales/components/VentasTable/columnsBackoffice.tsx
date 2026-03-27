/**
 * features/sales/components/VentasTable/columnsBackoffice.tsx
 *
 * CAMBIOS:
 *   ✓ Columna "Visita" muestra fecha + bloque horario debajo
 *   ✓ Sub-estados debajo de SOT EJECUCION
 *   ✓ Popup al pasar cursor por comentario de gestión (corrección)
 *   ✓ Botón "ojo" para ver detalles (todos los roles)
 *   ✓ Backoffice ve número móvil Y número de instalación en la tabla
 *   ✓ Fixes anteriores mantenidos
 */
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Eye,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Mic,
  XCircle,
  ArrowUp,
  ArrowDown,
  ChevronsUpDown,
  MessageCircle,
  Phone,
  Hash,
  Clock,
} from "lucide-react";
import { EstadoBadge } from "../EstadoBadge";
import type { Venta, EstadoSOT, EstadoAudio } from "../../types/sales.types";
import { ActionBtnBackoffice } from "@/components/ActionBtnBackoffice";
import { cn } from "@/lib/utils";

export function buildColumnsBackoffice(
  estadosSOT: EstadoSOT[],
  estadosAudio: EstadoAudio[],
  onGestionar: ((v: Venta) => void) | null,
  ordenFecha?: "asc" | "desc" | null,
  onToggleOrdenFecha?: () => void,
  onVerDetalle?: (v: Venta) => void,
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
      accessorKey: "nombre_asesor",
      header: "Asesor",
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <p className="text-[13px] font-medium text-foreground/90">
            {row.original.nombre_asesor}
          </p>
          <p className="text-[11px] text-muted-foreground/60">
            {row.original.nombre_supervisor}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "cliente_nombre",
      header: "Cliente",
      cell: ({ row }) => {
        const v = row.original;
        return (
          <div className="flex flex-col gap-1 items-start">
            <div className="flex items-center gap-2">
              <p className="font-medium text-[13px] text-foreground leading-none">
                {v.cliente_nombre}
              </p>
              {v.venta_origen && (
                <span className="inline-flex items-center gap-1 text-[9px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded-full border border-primary/20 uppercase tracking-widest">
                  <RefreshCw size={9} /> Reingreso
                </span>
              )}
            </div>
            <p className="font-mono text-[11px] text-muted-foreground">
              {v.cliente_numero_doc}
            </p>
            {/* ── Dos teléfonos: móvil + instalación ── */}
            <div className="flex flex-col gap-0.5 mt-0.5">
              {v.cliente_telefono && (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-foreground/60">
                  <Phone size={9} className="shrink-0" />
                  {v.cliente_telefono}
                </span>
              )}
              {v.numero_instalacion && (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-foreground/50">
                  <Hash size={9} className="shrink-0" />
                  {v.numero_instalacion}
                </span>
              )}
            </div>
          </div>
        );
      },
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
      header: "Estado General",
      cell: ({ row }) => {
        const v = row.original;
        const estadoId = v.id_estado_sot;
        const estadoData = estadosSOT.find((e) => e.id === estadoId);
        const enCorreccion = v.solicitud_correccion;
        const codigoEstado = estadoData?.codigo?.toUpperCase() ?? "";
        const tieneSubEstado =
          codigoEstado === "EJECUCION" && v.id_sub_estado_sot !== null;

        return (
          <div className="flex flex-col gap-1.5 items-start">
            {enCorreccion ? (
              /* Badge corrección con popup del comentario */
              <div className="relative group/correccion">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold tracking-widest bg-orange-500/10 border border-orange-500/30 text-orange-500 uppercase cursor-default">
                  <AlertTriangle size={11} /> En corrección
                  {v.comentario_gestion && (
                    <MessageCircle size={10} className="ml-0.5 opacity-70" />
                  )}
                </span>
                {v.comentario_gestion && (
                  <div className="absolute bottom-full left-0 mb-2 z-50 hidden group-hover/correccion:block w-64 pointer-events-none">
                    <div className="bg-card border border-orange-500/30 rounded-xl shadow-xl p-3">
                      <p className="text-[10px] font-mono font-bold text-orange-500 uppercase tracking-widest mb-1.5">
                        Comentario de gestión
                      </p>
                      <p className="text-[11px] text-foreground/80 leading-snug">
                        {v.comentario_gestion}
                      </p>
                    </div>
                    <div className="w-2.5 h-2.5 bg-card border-b border-r border-orange-500/30 rotate-45 ml-3 -mt-1.5" />
                  </div>
                )}
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

            {/* Sub-estado debajo de EJECUCION */}
            {tieneSubEstado && v.nombre_sub_estado && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20 max-w-[180px] truncate">
                {v.nombre_sub_estado}
              </span>
            )}

            {/* Comentario de gestión en estados no-corrección (chips) */}
            {v.comentario_gestion &&
              !enCorreccion &&
              v.id_estado_sot !== null && (
                <span className="text-[10px] font-mono text-muted-foreground/60 flex items-center gap-1 mt-0.5">
                  💬 Tiene comentario
                </span>
              )}
          </div>
        );
      },
    },
    {
      accessorKey: "id_estado_audios",
      header: "Audios",
      cell: ({ row }) => {
        const v = row.original;
        const estadoAudioData = estadosAudio.find(
          (e) => e.id === v.id_estado_audios,
        );
        const codigoAudio =
          estadoAudioData?.codigo.toUpperCase() || "PENDIENTE";

        let colorBadge = "bg-muted text-muted-foreground border-border";
        let Icon = Mic;

        if (codigoAudio === "CONFORME") {
          colorBadge =
            "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
          Icon = CheckCircle2;
        } else if (codigoAudio === "RECHAZADO") {
          colorBadge =
            "bg-destructive/10 text-destructive border-destructive/20";
          Icon = XCircle;
        }

        return (
          <div className="flex flex-col gap-0.5 items-start">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-widest border",
                colorBadge,
              )}
            >
              <Icon size={10} /> {estadoAudioData?.nombre || "Pendiente"}
            </span>
            {v.audio_subido ? (
              <span className="text-[9px] text-primary/70 mt-1 font-semibold flex items-center gap-1">
                <CheckCircle2 size={10} /> Subido a Claro
              </span>
            ) : (
              <span className="text-[9px] text-muted-foreground/50 mt-1">
                Sin subir a Claro
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
              <span className="text-[10px] text-muted-foreground/40">
                Sin asignar
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "fecha_visita_programada",
      header: "Visita",
      cell: ({ row }) => {
        const v = row.original;
        const fechaStr = v.fecha_visita_programada;

        if (!fechaStr) {
          return (
            <span className="text-[10px] text-muted-foreground/40">
              Sin programar
            </span>
          );
        }

        // Extrae el código de bloque entre paréntesis, ej: "(PM1)" → "PM1"
        const bloqueCorto = v.bloque_horario
          ? (v.bloque_horario.match(/\(([^)]+)\)/)?.[1] ?? v.bloque_horario)
          : null;

        return (
          <div className="flex flex-col gap-0.5">
            <span className="text-[13px] text-foreground/80">
              {format(new Date(`${fechaStr}T00:00:00`), "dd MMM yyyy", {
                locale: es,
              })}
            </span>
            {bloqueCorto && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
                <Clock size={10} />
                {bloqueCorto}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "fecha_venta",
      header: () => {
        if (!onToggleOrdenFecha) {
          return <span>Fecha venta</span>;
        }

        const Icon =
          ordenFecha === "asc"
            ? ArrowUp
            : ordenFecha === "desc"
              ? ArrowDown
              : ChevronsUpDown;

        return (
          <button
            type="button"
            onClick={onToggleOrdenFecha}
            className={cn(
              "flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-widest transition-colors",
              ordenFecha
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Fecha venta
            <Icon size={12} className="shrink-0" />
          </button>
        );
      },
      cell: ({ row }) => {
        const fechaStr = row.original.fecha_venta;
        return fechaStr ? (
          <span className="font-mono text-[10px] text-muted-foreground">
            {format(new Date(fechaStr), "dd/MM/yy HH:mm")}
          </span>
        ) : (
          <span className="text-[10px] text-muted-foreground/40">—</span>
        );
      },
    },
    {
      id: "acciones",
      header: "",
      cell: ({ row }) => {
        const v = row.original;
        const esAtendida = v.codigo_estado?.toUpperCase() === "ATENDIDO";
        const esRechazada = v.codigo_estado?.toUpperCase() === "RECHAZADO";

        return (
          <div className="flex items-center gap-1.5">
            {/* Botón ojo — ver detalles (siempre visible para todos) */}
            {onVerDetalle && (
              <button
                type="button"
                onClick={() => onVerDetalle(v)}
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-border bg-background text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all"
                title="Ver detalles de la venta"
              >
                <Eye size={14} />
              </button>
            )}

            {/* Botón gestionar */}
            {onGestionar === null ? (
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/40 uppercase tracking-widest">
                <Eye size={12} /> Solo lectura
              </div>
            ) : esAtendida ? (
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-500/70 uppercase tracking-widest">
                <CheckCircle2 size={12} /> Finalizada
              </div>
            ) : esRechazada && v.ya_reingresada ? (
              <span className="inline-flex items-center gap-1 text-[9px] font-mono text-primary/60 bg-primary/5 px-2 py-1 rounded-full border border-primary/15 uppercase tracking-widest whitespace-nowrap">
                <RefreshCw size={8} /> Ya reingresada
              </span>
            ) : (
              <ActionBtnBackoffice
                onClick={() => onGestionar(v)}
                variant="primary"
                title="Gestionar venta"
              >
                <Eye size={14} /> Gestionar
              </ActionBtnBackoffice>
            )}
          </div>
        );
      },
      size: 130,
    },
  ];
}
