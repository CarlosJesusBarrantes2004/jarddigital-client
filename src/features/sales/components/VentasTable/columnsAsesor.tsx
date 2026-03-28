import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Pencil,
  AlertTriangle,
  RefreshCw,
  Trash2,
  MessageCircle,
  Eye,
  Clock,
} from "lucide-react";
import { EstadoBadge } from "../EstadoBadge";
import type { Venta, EstadoSOT } from "../../types/sales.types";
import { ActionBtn } from "@/components/ActionBtn";
import { cn } from "@/lib/utils";

// ── Popup de comentario (misma lógica que backoffice) ─────────────────────────

function ComentarioPopup({
  comentario,
  colorClass = "text-muted-foreground bg-muted border-border",
  borderClass = "border-border",
  labelColor = "text-muted-foreground",
  label = "Comentario de gestión",
}: {
  comentario: string;
  colorClass?: string;
  borderClass?: string;
  labelColor?: string;
  label?: string;
}) {
  return (
    <div className="relative group/comentario inline-flex items-center cursor-default">
      <span
        className={cn(
          "inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md border",
          colorClass,
          borderClass,
        )}
      >
        <MessageCircle size={10} />
        Comentario
      </span>
      <div className="absolute bottom-full left-0 mb-2 z-50 hidden group-hover/comentario:block w-64 pointer-events-none">
        <div
          className={cn("bg-card rounded-xl shadow-xl p-3 border", borderClass)}
        >
          <p
            className={cn(
              "text-[10px] font-mono font-bold uppercase tracking-widest mb-1.5",
              labelColor,
            )}
          >
            {label}
          </p>
          <p className="text-[11px] text-foreground/80 leading-snug whitespace-pre-wrap">
            {comentario}
          </p>
        </div>
        <div
          className={cn(
            "w-2.5 h-2.5 bg-card border-b border-r rotate-45 ml-3 -mt-1.5",
            borderClass,
          )}
        />
      </div>
    </div>
  );
}

// ── Columnas ──────────────────────────────────────────────────────────────────

export function buildColumnsAsesor(
  estadosSOT: EstadoSOT[],
  onEditar: (v: Venta) => void,
  onReingresar: (v: Venta) => void,
  onEliminar: (v: Venta) => void,
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
        const esRechazada =
          codigoEstado === "RECHAZADO" || codigoEstado === "RECHAZADA";
        const esEjecucion = codigoEstado === "EJECUCION";
        const tieneSubEstado = esEjecucion && v.id_sub_estado_sot !== null;

        // Color del popup según estado
        const popupConfig = v.solicitud_correccion
          ? {
              colorClass:
                "text-orange-500 bg-orange-500/10 border-orange-500/30",
              borderClass: "border-orange-500/30",
              labelColor: "text-orange-500",
              label: "Qué debes corregir",
            }
          : esRechazada
            ? {
                colorClass:
                  "text-destructive bg-destructive/10 border-destructive/30",
                borderClass: "border-destructive/30",
                labelColor: "text-destructive",
                label: "Motivo del rechazo",
              }
            : {
                colorClass: "text-blue-500 bg-blue-500/10 border-blue-500/20",
                borderClass: "border-blue-500/20",
                labelColor: "text-blue-500",
                label: "Comentario de gestión",
              };

        return (
          <div className="flex flex-col gap-1.5 items-start">
            {/* Badge de estado principal */}
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

            {/* Badge "En corrección" (adicional, debajo del estado) */}
            {v.solicitud_correccion && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <AlertTriangle size={11} className="text-orange-500 shrink-0" />
                <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider leading-none">
                  En corrección
                </span>
              </div>
            )}

            {/* Sub-estado (siempre que exista, principalmente en EJECUCION) */}
            {tieneSubEstado && v.nombre_sub_estado && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20 max-w-[180px] truncate">
                {v.nombre_sub_estado}
              </span>
            )}

            {/* Comentario de gestión — SIEMPRE visible si existe, en cualquier estado */}
            {v.comentario_gestion && (
              <ComentarioPopup
                comentario={v.comentario_gestion}
                colorClass={popupConfig.colorClass}
                borderClass={popupConfig.borderClass}
                labelColor={popupConfig.labelColor}
                label={popupConfig.label}
              />
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
        const v = row.original;
        const fechaStr = v.fecha_visita_programada;
        if (!fechaStr)
          return (
            <span className="text-[10px] text-muted-foreground/40">
              Sin programar
            </span>
          );
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
        const puedeEliminar = esPendiente;
        const yaReingresada = !!(v as Venta & { ya_reingresada?: boolean })
          .ya_reingresada;

        return (
          <div className="flex items-center gap-1.5 flex-wrap">
            {onVerDetalle && (
              <ActionBtn
                onClick={() => onVerDetalle(v)}
                variant="default"
                title="Ver detalles de la venta"
              >
                <Eye size={12} />
              </ActionBtn>
            )}
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
            {esRechazada && !v.permitir_reingreso && (
              <span className="text-[10px] font-mono text-destructive/50 uppercase tracking-widest px-1">
                Rechazada
              </span>
            )}
            {esRechazada && v.permitir_reingreso && !yaReingresada && (
              <ActionBtn
                onClick={() => onReingresar(v)}
                variant="primary"
                title="Crear nuevo reingreso con estos datos"
              >
                <RefreshCw size={12} /> Reingresar
              </ActionBtn>
            )}
            {esRechazada && v.permitir_reingreso && yaReingresada && (
              <span className="inline-flex items-center gap-1 text-[9px] font-mono text-primary/60 bg-primary/5 px-2 py-1 rounded-full border border-primary/15 uppercase tracking-widest whitespace-nowrap">
                <RefreshCw size={8} /> Ya reingresada
              </span>
            )}
            {puedeEliminar && (
              <ActionBtn
                onClick={() => onEliminar(v)}
                variant="warning"
                title="Eliminar venta (solo pendientes)"
              >
                <Trash2 size={12} />
              </ActionBtn>
            )}
          </div>
        );
      },
      size: 180,
    },
  ];
}
