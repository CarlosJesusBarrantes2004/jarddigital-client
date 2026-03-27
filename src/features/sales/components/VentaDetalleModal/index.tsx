import {
  X,
  Lock,
  Phone,
  Hash,
  FileAudio,
  Play,
  Pause,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Venta } from "../../types/sales.types";
import { toast } from "sonner";
import { extractApiError } from "@/lib/api-errors";

function ReadonlyField({
  label,
  value,
  className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-1">
        {label}
      </p>
      <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-muted/50 border border-border min-h-[40px]">
        <Lock size={11} className="text-muted-foreground/50 shrink-0" />
        <span className="text-sm font-sans text-foreground/80 leading-snug">
          {value ?? <span className="text-muted-foreground/40">—</span>}
        </span>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="mb-3 pb-2 border-b border-border/50">
        <p className="font-mono text-[11px] tracking-widest uppercase font-bold text-primary">
          {title}
        </p>
      </div>
      {children}
    </div>
  );
}

function AudioMiniPlayer({
  audio,
  index,
}: {
  audio: {
    id?: number;
    nombre_etiqueta: string;
    url_audio: string;
    conforme: boolean | null;
    motivo: string | null;
  };
  index: number;
}) {
  const [playing, setPlaying] = useState(false);
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);

  const toggle = () => {
    if (!audioEl) {
      const el = new Audio(audio.url_audio);
      el.onended = () => setPlaying(false);
      el.play();
      setAudioEl(el);
      setPlaying(true);
    } else {
      if (playing) {
        audioEl.pause();
        setPlaying(false);
      } else {
        audioEl.play();
        setPlaying(true);
      }
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(audio.url_audio);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Audio_${index + 1}.mp3`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      toast.error(extractApiError(err));
    }
  };

  const isConforme = audio.conforme === true;
  const isNoConforme = audio.conforme === false;

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl border text-sm",
        isConforme
          ? "bg-emerald-500/5 border-emerald-500/20"
          : isNoConforme
            ? "bg-destructive/5 border-destructive/20"
            : "bg-card border-border",
      )}
    >
      <span
        className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shrink-0 border",
          isConforme
            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-500"
            : isNoConforme
              ? "bg-destructive/20 border-destructive/40 text-destructive"
              : "bg-muted border-border text-muted-foreground",
        )}
      >
        {index + 1}
      </span>
      <p className="flex-1 text-[12px] text-foreground/80 leading-snug truncate">
        {audio.nombre_etiqueta}
      </p>
      {isNoConforme && audio.motivo && (
        <span
          className="text-[10px] text-destructive/80 italic max-w-[100px] truncate"
          title={audio.motivo}
        >
          {audio.motivo}
        </span>
      )}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={handleDownload}
          className="w-7 h-7 rounded-full border border-border bg-background text-muted-foreground hover:text-primary hover:border-primary/30 transition-all flex items-center justify-center"
          title="Descargar"
        >
          <Download size={12} />
        </button>
        <button
          type="button"
          onClick={toggle}
          className={cn(
            "w-7 h-7 rounded-full border flex items-center justify-center transition-all",
            playing
              ? "bg-primary/20 border-primary/40 text-primary"
              : "bg-background border-border text-muted-foreground hover:bg-muted",
          )}
        >
          {playing ? (
            <Pause size={12} />
          ) : (
            <Play size={12} className="ml-0.5" />
          )}
        </button>
      </div>
    </div>
  );
}

interface VentaDetalleModalProps {
  open: boolean;
  onClose: () => void;
  venta: Venta;
}

const TABS_DETALLE = [
  { id: "cliente", label: "Cliente" },
  { id: "ubicacion", label: "Ubicación" },
  { id: "audios", label: "Audios" },
];

export function VentaDetalleModal({
  open,
  onClose,
  venta,
}: VentaDetalleModalProps) {
  const [tab, setTab] = useState("cliente");

  if (!open) return null;

  const formatFecha = (iso: string | null | undefined) => {
    if (!iso) return null;
    try {
      return format(new Date(iso), "dd/MM/yyyy HH:mm", { locale: es });
    } catch {
      return iso.split("T")[0];
    }
  };

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-[2000] bg-black/40 animate-in fade-in duration-200"
      />

      <div className="fixed top-0 right-0 bottom-0 w-full sm:max-w-xl bg-card border-l border-border z-[2001] flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-5 border-b border-border shrink-0 bg-card/50">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-1">
                #{venta.id} · {venta.tipo_venta ?? "—"} · {venta.tecnologia}
              </p>
              <h2 className="font-serif text-xl font-bold text-foreground leading-tight truncate">
                {venta.cliente_nombre}
              </h2>
              <p className="text-[12px] text-muted-foreground font-mono mt-0.5">
                {venta.cliente_numero_doc}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors shrink-0"
            >
              <X size={16} />
            </button>
          </div>

          {/* Estado */}
          {venta.nombre_estado && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span
                className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-widest border"
                style={{
                  backgroundColor: venta.id_estado_sot
                    ? `${venta.nombre_estado}15`
                    : undefined,
                  borderColor: "#888",
                  color: "#888",
                }}
              >
                {venta.nombre_estado}
              </span>
              {venta.codigo_sot && (
                <span className="font-mono text-[11px] text-muted-foreground">
                  SOT: {venta.codigo_sot}
                </span>
              )}
              {venta.codigo_sec && (
                <span className="font-mono text-[11px] text-muted-foreground">
                  SEC: {venta.codigo_sec}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex px-5 border-b border-border shrink-0 bg-background">
          {TABS_DETALLE.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "px-4 py-3 border-b-2 text-sm font-medium transition-all -mb-px",
                tab === t.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
              )}
            >
              {t.label}
              {t.id === "audios" && venta.audios?.length > 0 && (
                <span className="ml-1.5 text-[10px] text-muted-foreground">
                  ({venta.audios.length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-5 bg-background space-y-6">
          {/* ── TAB CLIENTE ── */}
          {tab === "cliente" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <Section title="Plan & Producto">
                <div className="grid grid-cols-2 gap-3">
                  <ReadonlyField
                    label="Campaña"
                    value={venta.producto_campana}
                  />
                  <ReadonlyField
                    label="Solución"
                    value={venta.producto_solucion}
                  />
                  <ReadonlyField
                    label="Paquete"
                    value={venta.producto_paquete}
                    className="col-span-2"
                  />
                  <ReadonlyField label="Tecnología" value={venta.tecnologia} />
                  <ReadonlyField
                    label="Tipo documento"
                    value={
                      venta.codigo_tipo_documento ??
                      `Tipo ${venta.id_tipo_documento}`
                    }
                  />
                </div>
              </Section>

              <Section title="Datos Personales">
                <div className="grid grid-cols-2 gap-3">
                  <ReadonlyField
                    label="Nombre / Razón social"
                    value={venta.cliente_nombre}
                    className="col-span-2"
                  />
                  <ReadonlyField
                    label="Número de documento"
                    value={venta.cliente_numero_doc}
                  />
                  <ReadonlyField
                    label="Fecha nacimiento"
                    value={venta.cliente_fecha_nacimiento?.split("T")[0]}
                  />
                  <ReadonlyField label="Género" value={venta.cliente_genero} />
                  <ReadonlyField
                    label="Nombre del padre"
                    value={venta.cliente_papa}
                  />
                  <ReadonlyField
                    label="Nombre de la madre"
                    value={venta.cliente_mama}
                  />
                  {/* ── Dos teléfonos ── */}
                  <ReadonlyField
                    label={
                      <span className="flex items-center gap-1">
                        <Phone size={10} /> Teléfono móvil
                      </span>
                    }
                    value={venta.cliente_telefono}
                  />
                  <ReadonlyField
                    label={
                      <span className="flex items-center gap-1">
                        <Hash size={10} /> Nro. instalación
                      </span>
                    }
                    value={venta.numero_instalacion}
                  />
                  <ReadonlyField
                    label="Email"
                    value={venta.cliente_email}
                    className="col-span-2"
                  />
                </div>
              </Section>

              {venta.representante_legal_nombre && (
                <Section title="Representante Legal (RUC)">
                  <div className="grid grid-cols-2 gap-3">
                    <ReadonlyField
                      label="DNI representante"
                      value={venta.representante_legal_dni}
                    />
                    <ReadonlyField
                      label="Nombre representante"
                      value={venta.representante_legal_nombre}
                    />
                  </div>
                </Section>
              )}

              <Section title="Lugar de Nacimiento">
                <div className="grid grid-cols-3 gap-3">
                  <ReadonlyField
                    label="Departamento"
                    value={venta.departamento_nacimiento_nombre}
                  />
                  <ReadonlyField
                    label="Provincia"
                    value={venta.provincia_nacimiento_nombre}
                  />
                  <ReadonlyField
                    label="Distrito"
                    value={venta.distrito_nacimiento_nombre}
                  />
                </div>
              </Section>

              <Section title="Gestión">
                <div className="grid grid-cols-2 gap-3">
                  <ReadonlyField label="Asesor" value={venta.nombre_asesor} />
                  <ReadonlyField
                    label="Supervisor"
                    value={venta.nombre_supervisor}
                  />
                  <ReadonlyField
                    label="Grabador de audios"
                    value={venta.grabador_real}
                  />
                  <ReadonlyField
                    label="Tipo de venta"
                    value={venta.tipo_venta}
                  />
                  <ReadonlyField
                    label="Score crediticio"
                    value={venta.score_crediticio}
                  />
                  <ReadonlyField
                    label="Es Full Claro"
                    value={venta.es_full_claro ? "Sí" : "No"}
                  />
                  <ReadonlyField
                    label="Fecha de venta"
                    value={formatFecha(venta.fecha_venta)}
                  />
                  <ReadonlyField
                    label="Fecha de creación"
                    value={formatFecha(venta.fecha_creacion)}
                  />
                  {venta.fecha_visita_programada && (
                    <ReadonlyField
                      label="Visita programada"
                      value={`${venta.fecha_visita_programada}${venta.bloque_horario ? ` · ${venta.bloque_horario}` : ""}`}
                      className="col-span-2"
                    />
                  )}
                  {venta.fecha_real_inst && (
                    <ReadonlyField
                      label="Fecha instalación real"
                      value={formatFecha(venta.fecha_real_inst)}
                    />
                  )}
                  {venta.fecha_rechazo && (
                    <ReadonlyField
                      label="Fecha de rechazo"
                      value={formatFecha(venta.fecha_rechazo)}
                    />
                  )}
                  {venta.comentario_gestion && (
                    <div className="col-span-2">
                      <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-1">
                        Comentario de gestión
                      </p>
                      <div className="px-3.5 py-2.5 rounded-xl bg-muted/50 border border-border text-sm text-foreground/80 leading-snug">
                        {venta.comentario_gestion}
                      </div>
                    </div>
                  )}
                </div>
              </Section>
            </div>
          )}

          {/* ── TAB UBICACIÓN ── */}
          {tab === "ubicacion" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <Section title="Dirección de Instalación">
                <div className="grid grid-cols-2 gap-3">
                  <ReadonlyField
                    label="Departamento"
                    value={venta.departamento_instalacion_nombre}
                  />
                  <ReadonlyField
                    label="Provincia"
                    value={venta.provincia_instalacion_nombre}
                  />
                  <ReadonlyField
                    label="Distrito"
                    value={venta.distrito_instalacion_nombre}
                  />
                  <ReadonlyField label="Plano" value={venta.plano} />
                  <ReadonlyField
                    label="Dirección detallada"
                    value={venta.direccion_detalle}
                    className="col-span-2"
                  />
                  <ReadonlyField
                    label="Referencias"
                    value={venta.referencias}
                    className="col-span-2"
                  />
                  <ReadonlyField
                    label="Coordenadas GPS"
                    value={venta.coordenadas_gps}
                    className="col-span-2"
                  />
                </div>
              </Section>

              {(venta.cant_decos_adicionales > 0 ||
                venta.cant_repetidores_adicionales > 0) && (
                <Section title="Equipos Adicionales">
                  <div className="grid grid-cols-2 gap-3">
                    {venta.cant_decos_adicionales > 0 && (
                      <ReadonlyField
                        label="Decos adicionales"
                        value={`${venta.cant_decos_adicionales}`}
                      />
                    )}
                    {venta.cant_repetidores_adicionales > 0 && (
                      <ReadonlyField
                        label="Repetidores"
                        value={`${venta.cant_repetidores_adicionales}`}
                      />
                    )}
                  </div>
                </Section>
              )}
            </div>
          )}

          {/* ── TAB AUDIOS ── */}
          {tab === "audios" && (
            <div className="space-y-3 animate-in fade-in duration-300">
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border">
                <div className="flex items-center gap-2">
                  <FileAudio size={16} className="text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">
                    {venta.audios?.length ?? 0} audios registrados
                  </p>
                </div>
                {venta.audio_subido && (
                  <span className="text-[10px] font-mono text-primary/70 uppercase tracking-widest">
                    ✓ Subido a Claro
                  </span>
                )}
              </div>

              {!venta.audios || venta.audios.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <FileAudio size={36} className="mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No hay audios registrados.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {venta.audios.map((audio, i) => (
                    <AudioMiniPlayer
                      key={audio.id ?? i}
                      audio={audio}
                      index={i}
                    />
                  ))}
                </div>
              )}

              {venta.observacion_audios && (
                <div className="p-3 rounded-xl bg-destructive/5 border border-destructive/20">
                  <p className="text-[10px] font-mono font-bold text-destructive uppercase tracking-widest mb-1">
                    Observación de audios
                  </p>
                  <p className="text-[12px] text-destructive/80">
                    {venta.observacion_audios}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-card shrink-0">
          <button
            onClick={onClose}
            className="w-full h-11 rounded-xl border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-sm font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </>
  );
}
