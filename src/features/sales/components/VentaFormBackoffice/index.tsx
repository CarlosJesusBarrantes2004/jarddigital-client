import { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  X,
  Loader2,
  Lock,
  RefreshCw,
  AlertTriangle,
  ChevronDown,
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  FileAudio,
  User,
  Settings,
  Clock,
  Download,
  Eraser,
} from "lucide-react";
import { cn } from "@/lib/utils";

import {
  useUpdateVentaBackoffice,
  useEstadosSOT,
  useSubEstadosSOT,
  useEstadosAudio,
} from "../../hooks/useSales";
import type { Venta } from "../../types/sales.types";
import { Button } from "@/components/ui/button";
import { extractApiError } from "@/lib/api-errors";

// ── Schema ────────────────────────────────────────────────────────────────────
const schema = z.object({
  codigo_sec: z.string().optional(),
  codigo_sot: z.string().optional(),
  fecha_visita_programada: z.string().nullable().optional(),
  bloque_horario: z.string().nullable().optional(),
  id_sub_estado_sot: z.number().nullable().optional(),
  id_estado_sot: z.number().nullable().optional(),
  fecha_real_inst: z.string().nullable().optional(),
  fecha_rechazo: z.string().nullable().optional(),
  comentario_gestion: z.string().nullable().optional(),
  solicitud_correccion: z.boolean(),
  permitir_reingreso: z.boolean(),
  audio_subido: z.boolean(),
  id_estado_audios: z.number().nullable().optional(),
  observacion_audios: z.string().nullable().optional(),
});

type FormValues = z.infer<typeof schema>;

// ── Helpers UI ────────────────────────────────────────────────────────────────
function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-1.5">
      {children}
      {required && <span className="text-destructive ml-1">*</span>}
    </p>
  );
}

function ReadonlyField({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-muted/50 border border-border min-h-[44px]">
        <Lock size={12} className="text-muted-foreground shrink-0" />
        <span className="text-sm font-sans text-foreground/80 leading-snug">
          {value ?? <span className="text-muted-foreground/50">—</span>}
        </span>
      </div>
    </div>
  );
}

function TextInput({
  label,
  error,
  required,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  required?: boolean;
}) {
  return (
    <div className={className}>
      <FieldLabel required={required}>{label}</FieldLabel>
      <input
        {...props}
        className={cn(
          "w-full h-11 px-3.5 rounded-xl bg-background border text-sm font-sans text-foreground outline-none transition-all duration-200 focus:ring-4 focus:ring-primary/10",
          error
            ? "border-destructive focus:border-destructive focus:ring-destructive/10"
            : "border-border focus:border-primary",
        )}
      />
      {error && (
        <p className="text-[11px] text-destructive mt-1 flex items-center gap-1">
          <AlertTriangle size={10} /> {error}
        </p>
      )}
    </div>
  );
}

function TextareaConLimpiar({
  label,
  error,
  value,
  onChange,
  onClear,
  placeholder,
  rows = 3,
  required,
}: {
  label: string;
  error?: string;
  value: string;
  onChange: (v: string) => void;
  onClear: () => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </p>
        {value.trim().length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground hover:text-destructive transition-colors px-1.5 py-0.5 rounded-md hover:bg-destructive/10"
          >
            <Eraser size={10} /> Limpiar
          </button>
        )}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={cn(
          "w-full px-3.5 py-3 rounded-xl bg-background border text-sm font-sans text-foreground outline-none resize-none transition-all duration-200 focus:ring-4 focus:ring-primary/10",
          error
            ? "border-destructive focus:border-destructive focus:ring-destructive/10"
            : "border-border focus:border-primary",
        )}
      />
      {error && (
        <p className="text-[11px] text-destructive mt-1 flex items-center gap-1">
          <AlertTriangle size={10} /> {error}
        </p>
      )}
    </div>
  );
}

function NativeSelect({
  label,
  error,
  required,
  value,
  onChange,
  children,
  placeholder,
  disabled,
}: {
  label: string;
  error?: string;
  required?: boolean;
  value: string | number;
  onChange: (v: string) => void;
  children: React.ReactNode;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={cn(
            "w-full h-11 pl-3.5 pr-10 rounded-xl bg-background border text-sm font-sans outline-none appearance-none transition-all duration-200 focus:ring-4 focus:ring-primary/10 cursor-pointer disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70",
            value ? "text-foreground" : "text-muted-foreground",
            error
              ? "border-destructive focus:border-destructive focus:ring-destructive/10"
              : "border-border focus:border-primary",
          )}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {children}
        </select>
        <ChevronDown
          size={14}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
      </div>
      {error && (
        <p className="text-[11px] text-destructive mt-1 flex items-center gap-1">
          <AlertTriangle size={10} /> {error}
        </p>
      )}
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      onClick={() => onChange(!checked)}
      className={cn(
        "flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all duration-200",
        checked
          ? "bg-primary/10 border-primary/30"
          : "bg-card border-border hover:bg-muted",
      )}
    >
      <div>
        <p
          className={cn(
            "text-sm font-medium",
            checked ? "text-primary" : "text-foreground",
          )}
        >
          {label}
        </p>
        {description && (
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {description}
          </p>
        )}
      </div>
      <div
        className={cn(
          "w-11 h-6 rounded-full relative transition-colors shrink-0",
          checked ? "bg-primary" : "bg-muted-foreground/30",
        )}
      >
        <div
          className={cn(
            "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm",
            checked ? "left-6" : "left-1",
          )}
        />
      </div>
    </div>
  );
}

function SectionTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 mb-4 pb-2 border-b border-border/50",
        className,
      )}
    >
      <p className="font-mono text-[11px] tracking-widest uppercase font-semibold text-primary">
        {children}
      </p>
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-border my-6" />;
}

// ── Audio QA ──────────────────────────────────────────────────────────────────
interface AudioQA {
  id: number;
  nombre_etiqueta: string;
  url_audio: string;
  conforme: boolean | null;
  motivo: string | null;
  corregido: boolean;
}

function AudioItemQA({
  audio,
  index,
  onQAUpdate,
  disabled,
}: {
  audio: AudioQA;
  index: number;
  onQAUpdate: (id: number, conforme: boolean, motivo: string) => void;
  disabled?: boolean;
}) {
  const [playing, setPlaying] = useState(false);
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);
  const isConforme = audio.conforme === true;
  const isNoConforme = audio.conforme === false;

  const togglePlay = () => {
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
      toast.info("Iniciando descarga...", { id: `dl-${audio.id}` });
      const response = await fetch(audio.url_audio);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `Audio_${index + 1}_${audio.nombre_etiqueta.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.mp3`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Audio descargado", { id: `dl-${audio.id}` });
    } catch (error) {
      toast.error(extractApiError(error));
    }
  };

  return (
    <div
      className={cn(
        "p-4 rounded-xl border transition-all duration-200",
        isConforme
          ? "bg-emerald-500/5 border-emerald-500/20"
          : isNoConforme
            ? "bg-destructive/5 border-destructive/20"
            : "bg-card border-border",
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span
            className={cn(
              "inline-flex items-center justify-center w-6 h-6 rounded-full border text-[10px] font-mono font-bold shrink-0",
              isConforme
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-500"
                : isNoConforme
                  ? "bg-destructive/20 border-destructive/40 text-destructive"
                  : "bg-muted border-border text-muted-foreground",
            )}
          >
            {index + 1}
          </span>
          <div className="flex-1 truncate">
            <p className="text-[13px] font-sans text-foreground/80 leading-snug truncate flex items-center gap-2">
              {audio.nombre_etiqueta}
              {audio.corregido && (
                <span className="text-[9px] font-mono text-cyan-500 bg-cyan-500/10 px-1.5 py-0.5 rounded-full uppercase tracking-widest border border-cyan-500/20">
                  Corregido
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center justify-center w-8 h-8 rounded-full border bg-background border-border text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all shrink-0"
            title="Descargar MP3"
          >
            <Download size={14} />
          </button>
          <button
            type="button"
            onClick={togglePlay}
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full border transition-all shrink-0",
              playing
                ? "bg-primary/20 border-primary/40 text-primary"
                : "bg-background border-border text-muted-foreground hover:bg-muted",
            )}
          >
            {playing ? (
              <Pause size={14} />
            ) : (
              <Play size={14} className="ml-0.5" />
            )}
          </button>
          <div
            className={cn(
              "flex gap-1.5 bg-background p-1 rounded-full border border-border",
              disabled && "opacity-40 pointer-events-none",
            )}
          >
            <button
              type="button"
              onClick={() => onQAUpdate(audio.id, true, "")}
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center transition-all",
                isConforme
                  ? "bg-emerald-500/20 text-emerald-500"
                  : "text-muted-foreground hover:bg-muted",
              )}
              title="Conforme"
            >
              <CheckCircle2 size={16} />
            </button>
            <button
              type="button"
              onClick={() => onQAUpdate(audio.id, false, audio.motivo || "")}
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center transition-all",
                isNoConforme
                  ? "bg-destructive/20 text-destructive"
                  : "text-muted-foreground hover:bg-muted",
              )}
              title="No conforme"
            >
              <XCircle size={16} />
            </button>
          </div>
        </div>
      </div>
      {isNoConforme && (
        <div className="mt-3 pl-9">
          <input
            type="text"
            placeholder="Motivo de no conformidad (obligatorio)…"
            value={audio.motivo || ""}
            onChange={(e) => onQAUpdate(audio.id, false, e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 rounded-lg bg-destructive/5 border border-destructive/20 text-destructive text-xs font-sans outline-none focus:border-destructive/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "gestion", label: "Gestión", icon: Settings },
  { id: "cliente", label: "Cliente", icon: User },
  { id: "audios", label: "Audios", icon: FileAudio },
];

interface VentaFormBackofficeProps {
  open: boolean;
  onClose: () => void;
  venta: Venta;
}

function buildDefaultValues(venta: Venta): FormValues {
  return {
    codigo_sec: venta.codigo_sec ?? "",
    codigo_sot: venta.codigo_sot ?? "",
    fecha_visita_programada: venta.fecha_visita_programada ?? null,
    bloque_horario: venta.bloque_horario ?? "",
    id_sub_estado_sot: venta.id_sub_estado_sot ?? null,
    id_estado_sot: venta.id_estado_sot ?? null,
    fecha_real_inst: venta.fecha_real_inst
      ? venta.fecha_real_inst.split("T")[0]
      : null,
    fecha_rechazo: venta.fecha_rechazo
      ? venta.fecha_rechazo.split("T")[0]
      : null,
    comentario_gestion: venta.comentario_gestion ?? "",
    solicitud_correccion: venta.solicitud_correccion ?? false,
    permitir_reingreso: venta.permitir_reingreso ?? false,
    audio_subido: venta.audio_subido ?? false,
    id_estado_audios: venta.id_estado_audios ?? null,
    observacion_audios: venta.observacion_audios ?? "",
  };
}

export function VentaFormBackoffice({
  open,
  onClose,
  venta,
}: VentaFormBackofficeProps) {
  const [tab, setTab] = useState("gestion");
  const [audiosQA, setAudiosQA] = useState<AudioQA[]>([]);

  const backofficeInteractuoRef = useRef(false);

  const { mutateAsync: updateVenta, isPending } = useUpdateVentaBackoffice(
    venta.id,
  );
  const { data: estadosSOT = [] } = useEstadosSOT();
  const { data: subEstados = [] } = useSubEstadosSOT();
  const { data: estadosAudio = [] } = useEstadosAudio();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: buildDefaultValues(venta),
  });

  useEffect(() => {
    if (!open) return;
    backofficeInteractuoRef.current = false;
    form.reset(buildDefaultValues(venta));
    setAudiosQA(venta.audios ? JSON.parse(JSON.stringify(venta.audios)) : []);
    setTab("gestion");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, venta.id]);

  const watchSolicitud = form.watch("solicitud_correccion");

  useEffect(() => {
    if (!backofficeInteractuoRef.current) return;
    const hayRechazados = audiosQA.some((a) => a.conforme === false);
    if (hayRechazados && !watchSolicitud) {
      form.setValue("solicitud_correccion", true);
      if (!form.getValues("comentario_gestion")) {
        form.setValue(
          "comentario_gestion",
          "Existen audios marcados como No Conformes. Revisa la pestaña de audios para ver los motivos.",
        );
      }
    }
  }, [audiosQA, watchSolicitud, form]);

  const handleQAUpdate = (id: number, conforme: boolean, motivo: string) => {
    backofficeInteractuoRef.current = true;
    setAudiosQA((prev) =>
      prev.map((a) => (a.id === id ? { ...a, conforme, motivo } : a)),
    );
  };

  const esPrimeraGestion =
    venta.id_estado_sot === null && !venta.solicitud_correccion;
  const esReingreso = !!venta.venta_origen && venta.id_estado_sot === null;
  const codigoEstadoActual = venta.codigo_estado?.toUpperCase() ?? "";
  const ventaEstaRechazada = codigoEstadoActual === "RECHAZADO";

  const estadosSotPermitidos = (() => {
    if (codigoEstadoActual === "ATENDIDO")
      return estadosSOT.filter((e) => e.codigo.toUpperCase() === "ATENDIDO");
    if (esPrimeraGestion || esReingreso)
      return estadosSOT.filter((e) => e.codigo.toUpperCase() === "EJECUCION");
    return estadosSOT.filter((e) =>
      ["EJECUCION", "ATENDIDO", "RECHAZADO"].includes(e.codigo.toUpperCase()),
    );
  })();

  const watchEstadoId = form.watch("id_estado_sot");
  const watchEstadoAudioId = form.watch("id_estado_audios");

  const estadoSeleccionado = estadosSOT.find(
    (e) => e.id === Number(watchEstadoId),
  );
  const estadoAudioSeleccionado = estadosAudio.find(
    (e) => e.id === Number(watchEstadoAudioId),
  );

  const esRechazado = estadoSeleccionado?.codigo.toUpperCase() === "RECHAZADO";
  const esEjecucion = estadoSeleccionado?.codigo.toUpperCase() === "EJECUCION";
  const esAtendido = estadoSeleccionado?.codigo.toUpperCase() === "ATENDIDO";
  const audioEsRechazado =
    estadoAudioSeleccionado?.codigo.toUpperCase() === "RECHAZADO";

  const onSubmit = form.handleSubmit(async (values) => {
    if (values.solicitud_correccion) {
      if (!values.comentario_gestion?.trim()) {
        form.setError("comentario_gestion", {
          message: "Obligatorio para solicitar corrección",
        });
        setTab("gestion");
        return toast.error("Debe indicar qué debe corregir el asesor.");
      }
      const audioSinMotivo = audiosQA.find(
        (a) => a.conforme === false && !a.motivo?.trim(),
      );
      if (audioSinMotivo) {
        setTab("audios");
        return toast.error(
          `El audio '${audioSinMotivo.nombre_etiqueta}' está marcado como No Conforme, debe escribir un motivo.`,
        );
      }
    } else {
      if (!values.id_estado_sot) {
        setTab("gestion");
        return toast.error("Debe seleccionar un Estado SOT para procesar.");
      }
      if (esRechazado) {
        if (!values.comentario_gestion?.trim()) {
          form.setError("comentario_gestion", {
            message: "Debe explicar el motivo del rechazo",
          });
          setTab("gestion");
          return toast.error(
            "Indique el motivo del rechazo para que el asesor lo sepa.",
          );
        }
      } else {
        if (!values.codigo_sot)
          return toast.error("El Código SOT es obligatorio para procesar.");
        if (!values.codigo_sec)
          return toast.error("El Código SEC es obligatorio para procesar.");
        if (!values.fecha_visita_programada)
          return toast.error("La Fecha de visita es obligatoria.");
        if (!values.bloque_horario)
          return toast.error("El Bloque horario es obligatorio.");
        if (!values.id_estado_audios)
          return toast.error("Debe evaluar el estado de los audios en Claro.");
      }
      if (audioEsRechazado && !values.observacion_audios?.trim()) {
        form.setError("observacion_audios", {
          message: "Obligatorio al rechazar audios",
        });
        return toast.error(
          "Debe detallar el motivo del rechazo de los audios en Claro.",
        );
      }
    }

    const toDay = (s?: string | null) => {
      if (!s) return null;
      const d = new Date(s.includes("T") ? s : `${s}T00:00:00`);
      d.setHours(0, 0, 0, 0);
      return d;
    };
    const fVenta = toDay(venta.fecha_venta);
    const fVisita = toDay(values.fecha_visita_programada);
    const fInst = toDay(values.fecha_real_inst);
    const fRechazo = toDay(values.fecha_rechazo);
    if (fVenta && fVisita && fVisita < fVenta)
      return toast.error(
        "La visita programada no puede ser anterior a la fecha de venta.",
      );
    if (fVenta && fInst && fInst < fVenta)
      return toast.error(
        "La fecha de instalación no puede ser anterior a la fecha de venta.",
      );
    if (fVenta && fRechazo && fRechazo < fVenta)
      return toast.error(
        "La fecha de rechazo no puede ser anterior a la fecha de venta.",
      );

    const audiosPayload = audiosQA.map((a) => ({
      id: a.id,
      nombre_etiqueta: a.nombre_etiqueta,
      url_audio: a.url_audio,
      conforme: a.conforme,
      motivo: a.motivo,
    }));

    // FIX #5: Si el estado destino es RECHAZADO o ATENDIDO y la venta tenía un
    // sub-estado en SOT, lo limpiamos enviando null para que no quede esa validación.
    const estadoDestinoCode = estadoSeleccionado?.codigo?.toUpperCase();
    const subEstadoFinal =
      estadoDestinoCode === "RECHAZADO" || estadoDestinoCode === "ATENDIDO"
        ? null
        : (values.id_sub_estado_sot ?? null);

    try {
      await updateVenta({
        codigo_sec: values.codigo_sec || undefined,
        codigo_sot: values.codigo_sot || undefined,
        fecha_visita_programada: values.fecha_visita_programada || null,
        bloque_horario: values.bloque_horario || null,
        // FIX #5: sub-estado limpiado si destino es RECHAZADO/ATENDIDO
        id_sub_estado_sot: subEstadoFinal,
        id_estado_sot: values.id_estado_sot ?? null,
        fecha_real_inst: values.fecha_real_inst || null,
        fecha_rechazo: values.fecha_rechazo || null,
        comentario_gestion: values.comentario_gestion || null,
        solicitud_correccion: values.solicitud_correccion,
        permitir_reingreso: esRechazado ? values.permitir_reingreso : false,
        audio_subido: values.audio_subido,
        id_estado_audios: values.id_estado_audios ?? null,
        observacion_audios: values.observacion_audios || null,
        audios: audiosPayload,
      });
      toast.success(
        values.solicitud_correccion
          ? "Devuelto al asesor para corrección"
          : "Venta procesada con éxito",
      );
      onClose();
    } catch (err) {
      toast.error(extractApiError(err));
    }
  });

  if (!open) return null;

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-[100] animate-in fade-in duration-300"
      />

      <div className="fixed top-0 right-0 bottom-0 w-full sm:max-w-2xl bg-card border-l border-border z-[101] flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* ── HEADER ── */}
        <div className="p-6 border-b border-border shrink-0 bg-card/50">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-2 mb-2">
                {(esPrimeraGestion || esReingreso) && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <Clock size={10} />{" "}
                    {esReingreso ? "Nuevo Reingreso" : "Primera Gestión"}
                  </span>
                )}
                {ventaEstaRechazada && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest bg-destructive/10 text-destructive border border-destructive/20">
                    <XCircle size={10} /> Rechazada
                  </span>
                )}
                {venta.venta_origen && !esReingreso && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest bg-primary/10 text-primary border border-primary/20">
                    <RefreshCw size={10} /> Origen #{venta.venta_origen}
                  </span>
                )}
                {venta.solicitud_correccion && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest bg-orange-500/10 text-orange-500 border border-orange-500/20">
                    <AlertTriangle size={10} /> En Corrección
                  </span>
                )}
              </div>
              <h2 className="font-serif text-2xl font-bold text-foreground leading-tight mb-1 truncate">
                {venta.cliente_nombre}
              </h2>
              <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                <span>#{venta.id}</span>
                <span className="font-sans text-foreground/70">
                  {venta.nombre_asesor}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── TABS ── */}
        <div className="flex px-6 border-b border-border shrink-0 bg-background">
          {TABS.map((t) => {
            const Icon = t.icon;
            const activo = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3.5 border-b-2 text-sm font-medium transition-all -mb-px",
                  activo
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
                )}
              >
                <Icon size={16} /> {t.label}
              </button>
            );
          })}
        </div>

        {/* ── CONTENIDO ── */}
        <div className="flex-1 overflow-y-auto p-6 bg-background">
          {/* ══ TAB GESTIÓN ══ */}
          {tab === "gestion" && (
            <form
              id="backoffice-form"
              onSubmit={onSubmit}
              className="space-y-6 animate-in fade-in duration-300"
            >
              {(esPrimeraGestion || esReingreso) && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <p className="text-sm font-bold text-amber-500 dark:text-amber-400 mb-1">
                    {esReingreso
                      ? "Reingreso por gestionar"
                      : "Primera gestión de esta venta"}
                  </p>
                  <p className="text-xs text-amber-600/80 dark:text-amber-400/80">
                    Se exige ingresar SOT, SEC, fecha de visita y evaluar los
                    audios para ponerla en EJECUCIÓN.
                  </p>
                </div>
              )}

              {ventaEstaRechazada && (
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                  <p className="text-sm font-bold text-destructive mb-1">
                    Esta venta está en estado RECHAZADO
                  </p>
                  <p className="text-xs text-destructive/70">
                    Puedes cambiar el Estado SOT a EJECUCIÓN si corresponde
                    reclasificarla, o mantener el rechazo completando el motivo.
                  </p>
                </div>
              )}

              <div>
                <SectionTitle>Códigos Operativos</SectionTitle>
                <div className="grid grid-cols-2 gap-4">
                  <Controller
                    control={form.control}
                    name="codigo_sec"
                    render={({ field }) => (
                      <TextInput
                        label="Código SEC"
                        placeholder="SEC-XXXXX"
                        {...field}
                        value={field.value ?? ""}
                      />
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="codigo_sot"
                    render={({ field }) => (
                      <TextInput
                        label="Código SOT"
                        placeholder="SOT-XXXXX"
                        {...field}
                        value={field.value ?? ""}
                      />
                    )}
                  />
                </div>
              </div>
              <Divider />

              <div>
                <SectionTitle>Programación de Visita</SectionTitle>
                <div className="grid grid-cols-2 gap-4">
                  <Controller
                    control={form.control}
                    name="fecha_visita_programada"
                    render={({ field }) => (
                      <TextInput
                        label="Fecha de visita"
                        type="date"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="bloque_horario"
                    render={({ field }) => (
                      <NativeSelect
                        label="Bloque horario"
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        placeholder="Seleccionar"
                      >
                        {[
                          "9:00 - 11:00 / (AM1)",
                          "11:00 - 1:00 / (AM2)",
                          "2:00 - 4:00 / (PM1)",
                          "4:00 - 6:00 / (PM2)",
                        ].map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </NativeSelect>
                    )}
                  />
                </div>
              </div>
              <Divider />

              <div>
                <SectionTitle>Gestión de Audios en Claro</SectionTitle>
                <div className="space-y-4">
                  <Controller
                    control={form.control}
                    name="audio_subido"
                    render={({ field }) => (
                      <Toggle
                        label="Audios subidos al operador"
                        description="Confirma que ya subiste los audios al sistema de Claro."
                        checked={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Controller
                      control={form.control}
                      name="id_estado_audios"
                      render={({ field }) => (
                        <NativeSelect
                          label="Estado de los audios"
                          value={field.value ?? ""}
                          onChange={(v) => field.onChange(v ? Number(v) : null)}
                          placeholder="Seleccionar estado"
                          error={
                            form.formState.errors.id_estado_audios?.message
                          }
                        >
                          {estadosAudio.map((e) => (
                            <option key={e.id} value={e.id}>
                              {e.nombre}
                            </option>
                          ))}
                        </NativeSelect>
                      )}
                    />
                    {audioEsRechazado && (
                      <Controller
                        control={form.control}
                        name="observacion_audios"
                        render={({ field }) => (
                          <TextInput
                            label="Motivo de rechazo en Claro"
                            required
                            placeholder="Falta audio de DNI..."
                            {...field}
                            value={field.value ?? ""}
                            error={
                              form.formState.errors.observacion_audios?.message
                            }
                          />
                        )}
                      />
                    )}
                  </div>
                </div>
              </div>
              <Divider />

              <div>
                <SectionTitle>Estado de la Venta</SectionTitle>
                <div className="space-y-4">
                  <Controller
                    control={form.control}
                    name="id_estado_sot"
                    render={({ field }) => (
                      <NativeSelect
                        label="Estado SOT"
                        value={field.value ?? ""}
                        onChange={(v) => {
                          const nuevoId = v ? Number(v) : null;
                          field.onChange(nuevoId);
                          // FIX #5: Si cambia a RECHAZADO o ATENDIDO, limpiamos el sub-estado
                          const nuevoEstado = estadosSOT.find(
                            (e) => e.id === nuevoId,
                          );
                          const nuevoCode =
                            nuevoEstado?.codigo?.toUpperCase() ?? "";
                          if (
                            nuevoCode === "RECHAZADO" ||
                            nuevoCode === "ATENDIDO"
                          ) {
                            form.setValue("id_sub_estado_sot", null);
                          }
                        }}
                        placeholder="Seleccionar"
                        disabled={codigoEstadoActual === "ATENDIDO"}
                      >
                        {estadosSotPermitidos.map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.nombre}
                          </option>
                        ))}
                      </NativeSelect>
                    )}
                  />
                  {esEjecucion && (
                    <Controller
                      control={form.control}
                      name="id_sub_estado_sot"
                      render={({ field }) => (
                        <NativeSelect
                          label="Sub-estado (opcional)"
                          value={field.value ?? ""}
                          onChange={(v) => field.onChange(v ? Number(v) : null)}
                          placeholder="Sin sub-estado"
                        >
                          {subEstados.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.nombre}
                            </option>
                          ))}
                        </NativeSelect>
                      )}
                    />
                  )}
                  {esAtendido && (
                    <Controller
                      control={form.control}
                      name="fecha_real_inst"
                      render={({ field }) => (
                        <TextInput
                          label="Fecha real de instalación"
                          type="date"
                          required
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(e.target.value || null)
                          }
                        />
                      )}
                    />
                  )}
                  {esRechazado && (
                    <Controller
                      control={form.control}
                      name="fecha_rechazo"
                      render={({ field }) => (
                        <TextInput
                          label="Fecha de rechazo"
                          type="date"
                          required
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(e.target.value || null)
                          }
                        />
                      )}
                    />
                  )}
                </div>
              </div>
              <Divider />

              <div>
                <SectionTitle>
                  {esRechazado
                    ? "Motivo del Rechazo"
                    : "Comentarios y Decisiones"}
                </SectionTitle>
                <div className="space-y-4">
                  {!esRechazado && (
                    <Controller
                      control={form.control}
                      name="solicitud_correccion"
                      render={({ field }) => (
                        <div
                          onClick={() => field.onChange(!field.value)}
                          className={cn(
                            "flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all border",
                            field.value
                              ? "bg-orange-500/10 border-orange-500/30"
                              : "bg-card border-border hover:bg-muted",
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <AlertTriangle
                              size={18}
                              className={
                                field.value
                                  ? "text-orange-500"
                                  : "text-muted-foreground"
                              }
                            />
                            <div>
                              <p
                                className={cn(
                                  "text-sm font-bold",
                                  field.value
                                    ? "text-orange-500"
                                    : "text-foreground",
                                )}
                              >
                                Solicitar corrección al Asesor
                              </p>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                {field.value
                                  ? "Devuelve la venta para que el asesor la edite"
                                  : "Activa esto para devolver la venta"}
                              </p>
                            </div>
                          </div>
                          <div
                            className={cn(
                              "w-11 h-6 rounded-full relative transition-colors",
                              field.value
                                ? "bg-orange-500"
                                : "bg-muted-foreground/30",
                            )}
                          >
                            <div
                              className={cn(
                                "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                                field.value ? "left-6" : "left-1",
                              )}
                            />
                          </div>
                        </div>
                      )}
                    />
                  )}

                  {esRechazado && (
                    <Controller
                      control={form.control}
                      name="permitir_reingreso"
                      render={({ field }) => (
                        <Toggle
                          label="Habilitar Reingreso al Asesor"
                          description="Permite que el asesor clone los datos de esta venta para intentar venderle nuevamente."
                          checked={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                  )}

                  <Controller
                    control={form.control}
                    name="comentario_gestion"
                    render={({ field }) => (
                      <TextareaConLimpiar
                        label={
                          esRechazado
                            ? "Motivo del rechazo (visible para el Asesor)"
                            : watchSolicitud
                              ? "Qué debe corregir el Asesor"
                              : "Comentario de gestión (opcional)"
                        }
                        required={esRechazado || watchSolicitud}
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        onClear={() => {
                          field.onChange("");
                          form.clearErrors("comentario_gestion");
                        }}
                        placeholder={
                          esRechazado
                            ? "Explica por qué la venta ha sido rechazada..."
                            : watchSolicitud
                              ? "Describe qué debe corregir el asesor..."
                              : "Observaciones internas opcionales..."
                        }
                        rows={3}
                        error={
                          form.formState.errors.comentario_gestion?.message
                        }
                      />
                    )}
                  />
                </div>
              </div>
            </form>
          )}

          {/* ══ TAB CLIENTE ══ */}
          {tab === "cliente" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <SectionTitle>Producto & Documento</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ReadonlyField
                  label="Plan / Producto"
                  value={
                    [
                      venta.producto_campana,
                      venta.producto_solucion,
                      venta.producto_paquete,
                    ]
                      .filter(Boolean)
                      .join(" - ") || "Producto sin nombre"
                  }
                />
                <ReadonlyField label="Tecnología" value={venta.tecnologia} />
                <ReadonlyField
                  label="Tipo documento"
                  value={`Tipo ${venta.codigo_tipo_documento}`}
                />
                <ReadonlyField
                  label="Número documento"
                  value={venta.cliente_numero_doc}
                />
              </div>
              <Divider />
              <SectionTitle>Datos Personales</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ReadonlyField
                  label="Nombre completo"
                  value={venta.cliente_nombre}
                />
                <ReadonlyField
                  label="Teléfono"
                  value={venta.cliente_telefono}
                />
                <ReadonlyField label="Email" value={venta.cliente_email} />
                <ReadonlyField
                  label="Fecha nacimiento"
                  value={venta.cliente_fecha_nacimiento?.split("T")[0]}
                />
                <ReadonlyField
                  label="Nombre del padre"
                  value={venta.cliente_papa}
                />
                <ReadonlyField
                  label="Nombre de la madre"
                  value={venta.cliente_mama}
                />
                <ReadonlyField label="Tipo venta" value={venta.tipo_venta} />
              </div>
              <Divider />
              <SectionTitle className="text-blue-500">
                Ubicación de Instalación
              </SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ReadonlyField
                  label="Dirección"
                  value={venta.direccion_detalle}
                />
                <ReadonlyField label="Plano" value={venta.plano} />
                <ReadonlyField label="GPS" value={venta.coordenadas_gps} />
                <ReadonlyField label="Referencias" value={venta.referencias} />
                <ReadonlyField
                  label="Full Claro"
                  value={venta.es_full_claro ? "Sí" : "No"}
                />
                <ReadonlyField
                  label="Score crediticio"
                  value={venta.score_crediticio}
                />
              </div>
            </div>
          )}

          {/* ══ TAB AUDIOS ══ */}
          {tab === "audios" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border mb-2">
                <div>
                  <p className="text-sm font-bold text-foreground mb-0.5">
                    {audiosQA.length} audios subidos
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Reproduce y marca cada audio. Si marcas uno como No Conforme
                    se activará la solicitud de corrección.
                  </p>
                </div>
              </div>
              {audiosQA.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground">
                  <FileAudio size={40} className="mx-auto mb-4 opacity-20" />
                  <p className="text-sm">No hay audios registrados.</p>
                </div>
              ) : (
                audiosQA.map((audio, i) => (
                  <AudioItemQA
                    key={audio.id ?? i}
                    audio={audio}
                    index={i}
                    onQAUpdate={handleQAUpdate}
                  />
                ))
              )}
            </div>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div className="p-4 border-t border-border bg-card shrink-0 flex gap-3">
          <Button
            variant="outline"
            className="flex-1 h-12 rounded-xl bg-transparent hover:bg-muted"
            onClick={onClose}
          >
            Cancelar
          </Button>
          {tab === "gestion" && (
            <Button
              onClick={onSubmit}
              disabled={isPending}
              className={cn(
                "flex-1 h-12 rounded-xl font-bold shadow-lg transition-all",
                watchSolicitud || esRechazado
                  ? "bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20"
                  : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20",
              )}
            >
              {isPending && <Loader2 className="animate-spin mr-2" size={18} />}
              {esRechazado
                ? "Guardar Rechazo"
                : watchSolicitud
                  ? "Devolver al Asesor"
                  : "Procesar Venta"}
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
