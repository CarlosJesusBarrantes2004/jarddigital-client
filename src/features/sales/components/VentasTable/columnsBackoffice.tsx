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

// ── Plantillas WhatsApp ───────────────────────────────────────────────────────

function buildMensajeDNI(v: Venta): string {
  const dep = v.departamento_nacimiento_nombre ?? "";
  const prov = v.provincia_nacimiento_nombre ?? "";
  const dist = v.distrito_nacimiento_nombre ?? "";
  const fechaNac = v.cliente_fecha_nacimiento
    ? format(new Date(v.cliente_fecha_nacimiento), "dd / MM / yyyy")
    : "";
  const ubicacionNac = [dep, prov, dist].filter(Boolean).join(" / ");
  const depInst = v.departamento_instalacion_nombre ?? "";
  const provInst = v.provincia_instalacion_nombre ?? "";
  const distInst = v.distrito_instalacion_nombre ?? "";
  const ubicacionInst = [depInst, provInst, distInst].filter(Boolean).join(" ");
  const direccion = [v.direccion_detalle, ubicacionInst]
    .filter(Boolean)
    .join(" - ");
  const padres = [v.cliente_papa, v.cliente_mama].filter(Boolean).join(" Y ");
  return (
    `1. ${v.cliente_nombre ?? ""}\n` +
    `2. ${v.cliente_numero_doc ?? ""}\n` +
    `3. ${ubicacionNac}${ubicacionNac && fechaNac ? " - " : ""}${fechaNac}\n` +
    `4. ${direccion}\n` +
    `5. ${padres}\n` +
    `6. ${v.cliente_telefono ?? ""}\n` +
    `7. ${v.cliente_email ?? ""}\n` +
    `8. NO\n9. SI\n10. SI ACEPTO\n11. SI AUTORIZO\n12. SI ACEPTO`
  );
}

function buildMensajeRUC(v: Venta): string {
  const dep = v.departamento_nacimiento_nombre ?? "";
  const prov = v.provincia_nacimiento_nombre ?? "";
  const dist = v.distrito_nacimiento_nombre ?? "";
  const fechaNac = v.cliente_fecha_nacimiento
    ? format(new Date(v.cliente_fecha_nacimiento), "dd / MM / yyyy")
    : "";
  const ubicacionNac = [dep, prov, dist].filter(Boolean).join(" / ");
  const depInst = v.departamento_instalacion_nombre ?? "";
  const provInst = v.provincia_instalacion_nombre ?? "";
  const distInst = v.distrito_instalacion_nombre ?? "";
  const ubicacionInst = [depInst, provInst, distInst].filter(Boolean).join(" ");
  const direccion = [v.direccion_detalle, ubicacionInst]
    .filter(Boolean)
    .join(" - ");
  const padres = [v.cliente_papa, v.cliente_mama].filter(Boolean).join(" Y ");
  return (
    `1. ${v.cliente_nombre ?? ""}\n` +
    `2. ${v.representante_legal_dni ?? ""}\n` +
    `3. ${ubicacionNac}${ubicacionNac && fechaNac ? " - " : ""}${fechaNac}\n` +
    `4. ${direccion}\n` +
    `5. ${padres}\n` +
    `6. ${v.cliente_telefono ?? ""}\n` +
    `7. ${v.cliente_email ?? ""}\n` +
    `8. NO\n9. SI\n10. SI ACEPTO\n11. SI AUTORIZO\n12. SI ACEPTO\n` +
    `13. ${v.cliente_numero_doc ?? ""}\n` +
    `14. ${v.representante_legal_nombre ?? ""}`
  );
}

function handleWhatsApp(v: Venta, esRUC: boolean) {
  const celular = v.celular_asesor;
  if (!celular) {
    alert(
      "Este asesor no tiene un número de celular registrado en el sistema.\nSolicita al administrador que lo agregue en el perfil del usuario.",
    );
    return;
  }
  const mensaje = esRUC ? buildMensajeRUC(v) : buildMensajeDNI(v);
  const numeroLimpio = celular.replace(/[\s\-()]/g, "");
  const numeroFinal = numeroLimpio.startsWith("+")
    ? numeroLimpio
    : `+51${numeroLimpio}`;
  const url = `https://wa.me/${numeroFinal.replace("+", "")}?text=${encodeURIComponent(mensaje)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

function WhatsAppIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

// ── Popup de comentario de gestión (reutilizable) ─────────────────────────────

/**
 * Muestra el comentario_gestion como tooltip al hacer hover.
 * Se adapta al color según el contexto (corrección = naranja, rechazo = rojo, ejecución = azul, etc.)
 */
function ComentarioPopup({
  comentario,
  colorClass = "text-muted-foreground",
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
      {/* Popup */}
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
        const estadoData = estadosSOT.find((e) => e.id === v.id_estado_sot);
        const enCorreccion = v.solicitud_correccion;
        const codigoEstado = estadoData?.codigo?.toUpperCase() ?? "";
        const tieneSubEstado =
          codigoEstado === "EJECUCION" && v.id_sub_estado_sot !== null;
        const esRechazado =
          codigoEstado === "RECHAZADO" || codigoEstado === "RECHAZADA";

        // Determina el color del popup según el estado
        const popupColor = enCorreccion
          ? {
              colorClass:
                "text-orange-500 bg-orange-500/10 border-orange-500/30",
              borderClass: "border-orange-500/30",
              labelColor: "text-orange-500",
              label: "Comentario de gestión",
            }
          : esRechazado
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
            {/* Badge principal de estado */}
            {enCorreccion ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold tracking-widest bg-orange-500/10 border border-orange-500/30 text-orange-500 uppercase cursor-default">
                <AlertTriangle size={11} /> En corrección
              </span>
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

            {/* Sub-estado (siempre que exista, no solo en EJECUCION) */}
            {tieneSubEstado && v.nombre_sub_estado && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20 max-w-[180px] truncate">
                {v.nombre_sub_estado}
              </span>
            )}

            {/* Comentario de gestión — SIEMPRE visible si existe, en cualquier estado */}
            {v.comentario_gestion && (
              <ComentarioPopup
                comentario={v.comentario_gestion}
                colorClass={popupColor.colorClass}
                borderClass={popupColor.borderClass}
                labelColor={popupColor.labelColor}
                label={popupColor.label}
              />
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
      accessorKey: "fecha_venta",
      header: () => {
        if (!onToggleOrdenFecha) return <span>Fecha venta</span>;
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
            Fecha venta <Icon size={12} className="shrink-0" />
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
        const esRUC = v.codigo_tipo_documento?.toUpperCase() === "RUC";

        return (
          <div className="flex items-center gap-1.5">
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

            <button
              type="button"
              onClick={() => handleWhatsApp(v, esRUC)}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center border transition-all",
                v.celular_asesor
                  ? "border-[#25D366]/40 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 hover:border-[#25D366]/60"
                  : "border-border bg-background text-muted-foreground/40 cursor-not-allowed",
              )}
              title={
                v.celular_asesor
                  ? `Enviar guión por WhatsApp al asesor (${v.celular_asesor})`
                  : "El asesor no tiene celular registrado"
              }
            >
              <WhatsAppIcon size={14} />
            </button>

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
      size: 150,
    },
  ];
}
