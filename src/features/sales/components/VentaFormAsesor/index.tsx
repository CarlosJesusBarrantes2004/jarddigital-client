import { useState, useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  User,
  MapPin,
  Mic,
  AlertTriangle,
  ChevronDown,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useCreateVenta,
  useUpdateVentaAsesor,
  useTiposDocumento,
  useProductos,
  useGrabadores,
} from "../../hooks/useSales";
import type { Venta } from "../../types/sales.types";
import {
  ETIQUETAS_AUDIO_DNI as ETIQUETAS_DNI,
  ETIQUETAS_AUDIO_RUC as ETIQUETAS_RUC,
} from "../../types/sales.types";
import { UbigeoCascada } from "./UbigeoCascada";
import { AudioUploadField } from "./AudioUploadField";
import { Button } from "@/components/ui/button";
import { extractApiError } from "@/lib/api-errors";

// ── Zod schema ────────────────────────────────────────────────────────────────
const schema = z
  .object({
    id_producto: z.number({ message: "Selecciona un producto" }),
    tecnologia: z.string().min(1, "Selecciona tecnología"),
    id_tipo_documento: z.number({
      message: "Selecciona tipo de documento",
    }),
    cliente_numero_doc: z.string().min(1, "Número de documento requerido"),
    cliente_nombre: z.string().min(2, "Nombre requerido"),
    cliente_telefono: z.string().min(7, "Teléfono requerido"),
    cliente_email: z.string().email("Email inválido"),
    cliente_fecha_nacimiento: z
      .string()
      .min(1, "Fecha de nacimiento requerida"),
    cliente_papa: z.string().min(2, "Nombre del padre requerido"),
    cliente_mama: z.string().min(2, "Nombre de la madre requerido"),
    numero_instalacion: z.string().min(1, "Número de instalación requerido"),
    cant_decos_adicionales: z.number().min(0),
    cant_repetidores_adicionales: z.number().min(0),
    representante_legal_dni: z.string().nullable().optional(),
    representante_legal_nombre: z.string().nullable().optional(),

    // Ubigeo instalación
    dep_inst_id: z.number().nullable(),
    prov_inst_id: z.number().nullable(),
    id_distrito_instalacion: z
      .number({ message: "Selecciona distrito de instalación" })
      .nullable(),

    // Ubigeo nacimiento
    dep_nac_id: z.number().nullable(),
    prov_nac_id: z.number().nullable(),
    id_distrito_nacimiento: z.number().nullable(),

    referencias: z.string().optional(),
    plano: z.string().min(1, "Número de plano requerido"),
    direccion_detalle: z.string().min(5, "Dirección requerida"),
    coordenadas_gps: z.string().optional(),
    es_full_claro: z.boolean(),
    score_crediticio: z.string().optional(),
    id_grabador_audios: z.number({ message: "Selecciona grabador" }),
    audio_urls: z.array(z.string()),
  })
  .refine((d) => d.id_distrito_instalacion !== null, {
    message: "Selecciona el distrito de instalación",
    path: ["id_distrito_instalacion"],
  });

type FormValues = z.infer<typeof schema>;

// ── Pasos ─────────────────────────────────────────────────────────────────────
const PASOS = [
  { id: "cliente", label: "Cliente", icon: User },
  { id: "ubicacion", label: "Ubicación", icon: MapPin },
  { id: "audios", label: "Audios", icon: Mic },
];

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

function TextInput({
  label,
  error,
  required,
  disabled,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <input
        {...props}
        disabled={disabled}
        className={cn(
          "w-full px-3.5 py-2.5 rounded-xl bg-background border text-sm font-sans text-foreground outline-none transition-all duration-200 focus:ring-4 focus:ring-primary/10",
          disabled
            ? "bg-muted opacity-60 cursor-not-allowed text-muted-foreground"
            : "hover:border-primary/50",
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
            "w-full h-10 pl-3.5 pr-10 rounded-xl bg-background border text-sm font-sans outline-none appearance-none transition-all duration-200 focus:ring-4 focus:ring-primary/10",
            disabled
              ? "cursor-not-allowed bg-muted opacity-60"
              : "cursor-pointer hover:border-primary/50",
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
    <div className={cn("mb-4 pb-2 border-b border-border/50", className)}>
      <p className="font-mono text-[11px] tracking-widest uppercase font-bold text-primary">
        {children}
      </p>
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-border my-6" />;
}

// ─────────────────────────────────────────────────────────────────────────────

interface VentaFormAsesorProps {
  open: boolean;
  onClose: () => void;
  ventaOrigen?: Venta | null;
}

export function VentaFormAsesor({
  open,
  onClose,
  ventaOrigen,
}: VentaFormAsesorProps) {
  const [paso, setPaso] = useState(0);
  const esEdicion = !!ventaOrigen;

  const esEjecucion = ventaOrigen?.codigo_estado?.toUpperCase() === "EJECUCION";
  const soloAudios = esEdicion && esEjecucion;

  console.log(ventaOrigen);

  const { mutateAsync: crearVenta, isPending: creando } = useCreateVenta();
  const { mutateAsync: editarVenta, isPending: editando } =
    useUpdateVentaAsesor(ventaOrigen?.id ?? 0);
  const isPending = creando || editando;

  const { data: tiposDoc = [] } = useTiposDocumento();
  const { data: productos = [] } = useProductos();

  console.log(ventaOrigen?.id_grabador_audios);

  const grabadorActualId = ventaOrigen?.id_grabador_audios ?? null;

  const { data: grabadores = [] } = useGrabadores(grabadorActualId);

  console.log(grabadores);

  const [audioIds, setAudioIds] = useState<(number | undefined)[]>([]);
  const [audioUrls, setAudioUrls] = useState<(string | null)[]>([]);
  const [audioUploading, setAudioUploading] = useState<boolean[]>([]);
  const [audioErrors, setAudioErrors] = useState<(string | null)[]>([]);

  const [audioRechazados, setAudioRechazados] = useState<boolean[]>([]);
  const [audioMotivos, setAudioMotivos] = useState<(string | null)[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      cant_decos_adicionales: 0,
      cant_repetidores_adicionales: 0,
      es_full_claro: false,
      audio_urls: [],
      dep_inst_id: null,
      prov_inst_id: null,
      id_distrito_instalacion: null,
      dep_nac_id: null,
      prov_nac_id: null,
      id_distrito_nacimiento: null,
    },
  });

  console.log(form);

  const tipoDocId = form.watch("id_tipo_documento");
  const tipoDoc = tiposDoc.find((t) => t.id === tipoDocId);
  const esRUC = tipoDoc?.codigo?.toUpperCase() === "RUC";
  const etiquetasAudio = esRUC ? ETIQUETAS_RUC : ETIQUETAS_DNI;

  console.log(ventaOrigen);

  useEffect(() => {
    const n = etiquetasAudio.length;
    setAudioUrls(Array(n).fill(null));
    setAudioIds(Array(n).fill(undefined));
    setAudioUploading(Array(n).fill(false));
    setAudioErrors(Array(n).fill(null));
    setAudioRechazados(Array(n).fill(false));
    setAudioMotivos(Array(n).fill(null));
  }, [etiquetasAudio.length]);

  useEffect(() => {
    if (!ventaOrigen || !open) return;
    const v = ventaOrigen;

    if (v.codigo_estado?.toUpperCase() === "EJECUCION") setPaso(2);
    else setPaso(0);

    form.reset({
      id_producto: v.id_producto,
      tecnologia: v.tecnologia,
      id_tipo_documento: v.id_tipo_documento,
      cliente_numero_doc: v.cliente_numero_doc,
      cliente_nombre: v.cliente_nombre,
      cliente_telefono: v.cliente_telefono,
      cliente_email: v.cliente_email,
      cliente_fecha_nacimiento: v.cliente_fecha_nacimiento?.split("T")[0] ?? "",
      cliente_papa: v.cliente_papa,
      cliente_mama: v.cliente_mama,
      numero_instalacion: v.numero_instalacion,
      cant_decos_adicionales: v.cant_decos_adicionales ?? 0,
      cant_repetidores_adicionales: v.cant_repetidores_adicionales ?? 0,
      representante_legal_dni: v.representante_legal_dni ?? "",
      representante_legal_nombre: v.representante_legal_nombre ?? "",
      referencias: v.referencias ?? "",
      plano: v.plano,
      direccion_detalle: v.direccion_detalle,
      coordenadas_gps: v.coordenadas_gps ?? "",
      es_full_claro: v.es_full_claro,
      score_crediticio: v.score_crediticio ?? "",
      id_grabador_audios: v.id_grabador_audios,
      dep_inst_id: null,
      prov_inst_id: null,
      id_distrito_instalacion: v.id_distrito_instalacion,
      dep_nac_id: null,
      prov_nac_id: null,
      id_distrito_nacimiento: v.id_distrito_nacimiento ?? null,
      audio_urls: [],
    });

    const newUrls = Array(etiquetasAudio.length).fill(null);
    const newIds = Array(etiquetasAudio.length).fill(undefined);
    const newRechazados = Array(etiquetasAudio.length).fill(false);
    const newMotivos = Array(etiquetasAudio.length).fill(null);

    etiquetasAudio.forEach((etiqueta, i) => {
      // Buscamos si la venta original tenía este audio
      const audioDB = v.audios.find((a) => a.nombre_etiqueta === etiqueta);
      if (audioDB) {
        newUrls[i] = audioDB.url_audio;
        newIds[i] = audioDB.id;
        // Si conforme es exactamente false, significa que el Backoffice lo rechazó
        newRechazados[i] = audioDB.conforme === false;
        newMotivos[i] = audioDB.motivo;
      }
    });

    setAudioUrls(newUrls);
    setAudioIds(newIds);
    setAudioRechazados(newRechazados);
    setAudioMotivos(newMotivos);
    setAudioUploading(Array(etiquetasAudio.length).fill(false));
    setAudioErrors(Array(etiquetasAudio.length).fill(null));
  }, [ventaOrigen, open, form, etiquetasAudio]);

  const handleClose = () => {
    form.reset();
    setPaso(0);
    setAudioUrls([]);
    onClose();
  };

  const handleAudioUploaded = useCallback((i: number, url: string) => {
    setAudioUrls((prev) => {
      const n = [...prev];
      n[i] = url;
      return n;
    });
    setAudioUploading((prev) => {
      const n = [...prev];
      n[i] = false;
      return n;
    });
    setAudioErrors((prev) => {
      const n = [...prev];
      n[i] = null;
      return n;
    });
  }, []);

  const handleAudioRemove = useCallback((i: number) => {
    setAudioUrls((prev) => {
      const n = [...prev];
      n[i] = null;
      return n;
    });
    setAudioRechazados((prev) => {
      const n = [...prev];
      n[i] = false;
      return n;
    });
  }, []);

  const handleAudioStart = useCallback((i: number) => {
    setAudioUploading((prev) => {
      const n = [...prev];
      n[i] = true;
      return n;
    });
    setAudioErrors((prev) => {
      const n = [...prev];
      n[i] = null;
      return n;
    });
  }, []);

  const handleAudioError = useCallback((i: number, err: string) => {
    setAudioUploading((prev) => {
      const n = [...prev];
      n[i] = false;
      return n;
    });
    setAudioErrors((prev) => {
      const n = [...prev];
      n[i] = err;
      return n;
    });
  }, []);

  const todosAudiosListos =
    audioUrls.length > 0 && audioUrls.every((u) => u !== null && u !== "");
  const algunoSubiendo = audioUploading.some(Boolean);

  /*const onSubmit = form.handleSubmit(async (values) => {
    if (!todosAudiosListos) {
      toast.error(`Debes subir los ${etiquetasAudio.length} audios requeridos`);
      setPaso(2);
      return;
    }
    if (algunoSubiendo) {
      toast.error("Espera a que terminen de subir los audios");
      return;
    }

    const audiosPayload = etiquetasAudio.map((etiqueta, i) => ({
      id: audioIds[i],
      nombre_etiqueta: etiqueta,
      url_audio: audioUrls[i]!,
    }));

    try {
      if (esEdicion) {
        await editarVenta({
          ...values,
          representante_legal_dni: esRUC
            ? (values.representante_legal_dni ?? null)
            : null,
          representante_legal_nombre: esRUC
            ? (values.representante_legal_nombre ?? null)
            : null,
          id_distrito_instalacion: values.id_distrito_instalacion!,
          id_distrito_nacimiento: values.id_distrito_nacimiento ?? null,
          audios: audiosPayload,
        });
        toast.success("Venta actualizada y enviada al Backoffice");
      } else {
        await crearVenta({
          ...values,
          representante_legal_dni: esRUC
            ? (values.representante_legal_dni ?? null)
            : null,
          representante_legal_nombre: esRUC
            ? (values.representante_legal_nombre ?? null)
            : null,
          id_distrito_instalacion: values.id_distrito_instalacion!,
          id_distrito_nacimiento: values.id_distrito_nacimiento ?? null,
          audios: audiosPayload,
        });
        toast.success("Venta creada correctamente");
      }
      handleClose();
    } catch (err) {
      toast.error(extractApiError(err));
    }
  });*/

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!todosAudiosListos) {
      toast.error(`Debes subir los ${etiquetasAudio.length} audios requeridos`);
      setPaso(2);
      return;
    }
    if (algunoSubiendo) {
      toast.error("Espera a que terminen de subir los audios");
      return;
    }

    const audiosPayload = etiquetasAudio.map((etiqueta, i) => ({
      id: audioIds[i],
      nombre_etiqueta: etiqueta,
      url_audio: audioUrls[i]!,
    }));

    // Si está en Ejecución, saltamos la validación de Zod del formulario (porque está disabled)
    // y enviamos directamente el payload de audios al Backend.
    if (soloAudios) {
      try {
        await editarVenta({ audios: audiosPayload } as unknown as Parameters<
          typeof editarVenta
        >[0]); // as any para bypassear tipos obligatorios en el PATCH parcial
        toast.success("Audios corregidos y enviados al Backoffice");
        handleClose();
      } catch (err) {
        toast.error(extractApiError(err));
      }
    } else {
      // Si es una venta nueva o pendiente, ejecutamos la validación normal de React Hook Form
      form.handleSubmit(async (values) => {
        try {
          if (esEdicion) {
            await editarVenta({
              ...values,
              representante_legal_dni: esRUC
                ? (values.representante_legal_dni ?? null)
                : null,
              representante_legal_nombre: esRUC
                ? (values.representante_legal_nombre ?? null)
                : null,
              id_distrito_instalacion: values.id_distrito_instalacion!,
              id_distrito_nacimiento: values.id_distrito_nacimiento ?? null,
              audios: audiosPayload,
            });
            toast.success("Venta actualizada y enviada al Backoffice");
          } else {
            await crearVenta({
              ...values,
              representante_legal_dni: esRUC
                ? (values.representante_legal_dni ?? null)
                : null,
              representante_legal_nombre: esRUC
                ? (values.representante_legal_nombre ?? null)
                : null,
              id_distrito_instalacion: values.id_distrito_instalacion!,
              id_distrito_nacimiento: values.id_distrito_nacimiento ?? null,
              audios: audiosPayload,
            });
            toast.success("Venta creada correctamente");
          }
          handleClose();
        } catch (err) {
          toast.error(extractApiError(err));
        }
      })(e);
    }
  };

  if (!open) return null;
  const errorsObj = form.formState.errors;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className="fixed inset-0 z-[1000] animate-in fade-in duration-300"
      />

      {/* Sheet */}
      <div className="fixed top-0 right-0 bottom-0 w-full sm:max-w-3xl bg-card border-l border-border z-[1001] flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* ── Header ── */}
        <div className="p-6 border-b border-border bg-card/50 flex flex-col shrink-0">
          <div className="flex items-start justify-between">
            <div>
              {esEdicion && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest bg-orange-500/10 text-orange-500 border border-orange-500/30 mb-2">
                  <AlertTriangle size={10} /> CORRECCIÓN SOLICITADA
                </span>
              )}
              <h2 className="font-serif text-2xl font-bold text-foreground leading-tight tracking-tight">
                {esEdicion ? "Corregir Venta" : "Nueva Venta Claro"}
              </h2>
              {esEdicion && ventaOrigen?.comentario_gestion && (
                <p className="text-xs text-orange-500/80 mt-1.5 max-w-lg leading-relaxed">
                  💬 {ventaOrigen.comentario_gestion}
                </p>
              )}
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors shrink-0"
            >
              <X size={16} />
            </button>
          </div>

          {/* Banner de Bloqueo Solo Audios */}
          {soloAudios && (
            <div className="mt-4 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
              <Lock size={16} className="text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-500/90 leading-relaxed">
                <strong>Venta en Ejecución.</strong> Por seguridad, los datos
                del cliente y ubicación están bloqueados. Solo tienes permitido
                reemplazar los audios rechazados.
              </p>
            </div>
          )}
        </div>

        {/* ── Stepper ── */}
        <div className="flex border-b border-border px-6 bg-background shrink-0">
          {PASOS.map((p, i) => {
            const Icon = p.icon;
            const activo = paso === i;
            const completo = paso > i;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPaso(i)}
                className={cn(
                  "flex items-center gap-2 px-5 py-3.5 border-b-2 text-sm transition-all -mb-px",
                  activo
                    ? "border-primary text-primary font-bold"
                    : "border-transparent font-medium hover:border-border",
                  completo
                    ? "text-emerald-500"
                    : !activo && "text-muted-foreground",
                )}
              >
                {completo ? <Check size={16} /> : <Icon size={16} />}
                {p.label}
              </button>
            );
          })}
        </div>

        {/* ── Contenido ── */}
        <div className="flex-1 overflow-y-auto p-6 bg-background">
          <form
            id="venta-form"
            onSubmit={handleCustomSubmit}
            className="space-y-6"
          >
            {/* PASO 0: CLIENTE */}
            <div
              className={cn(
                "space-y-8 animate-in fade-in duration-300",
                paso !== 0 && "hidden",
                soloAudios && "pointer-events-none opacity-60 grayscale-[20%]", // Bloqueo visual extremo
              )}
            >
              <div>
                <SectionTitle>Plan y Tecnología</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Controller
                    control={form.control}
                    name="id_producto"
                    render={({ field }) => (
                      <NativeSelect
                        label="Producto"
                        required
                        disabled={soloAudios}
                        value={field.value ?? ""}
                        onChange={(v) =>
                          field.onChange(v ? Number(v) : undefined)
                        }
                        placeholder="Seleccione producto"
                        error={errorsObj.id_producto?.message}
                      >
                        {productos.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nombre_plan}
                          </option>
                        ))}
                      </NativeSelect>
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="tecnologia"
                    render={({ field }) => (
                      <NativeSelect
                        label="Tecnología"
                        required
                        disabled={soloAudios}
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        placeholder="Seleccionar"
                        error={errorsObj.tecnologia?.message}
                      >
                        {["FTTH", "HFC"].map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </NativeSelect>
                    )}
                  />
                </div>
              </div>

              <Divider />

              <div>
                <SectionTitle>Datos del Cliente</SectionTitle>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Controller
                      control={form.control}
                      name="id_tipo_documento"
                      render={({ field }) => (
                        <NativeSelect
                          label="Tipo Documento"
                          required
                          disabled={soloAudios}
                          value={field.value ?? ""}
                          onChange={(v) =>
                            field.onChange(v ? Number(v) : undefined)
                          }
                          placeholder="Seleccionar"
                          error={errorsObj.id_tipo_documento?.message}
                        >
                          {tiposDoc.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.codigo}
                            </option>
                          ))}
                        </NativeSelect>
                      )}
                    />
                    <Controller
                      control={form.control}
                      name="cliente_numero_doc"
                      render={({ field }) => (
                        <TextInput
                          label="Número de documento"
                          required
                          disabled={soloAudios}
                          placeholder={esRUC ? "20XXXXXXXXX" : "12345678"}
                          {...field}
                          error={errorsObj.cliente_numero_doc?.message}
                        />
                      )}
                    />
                  </div>
                  <Controller
                    control={form.control}
                    name="cliente_nombre"
                    render={({ field }) => (
                      <TextInput
                        label="Nombre completo / Razón Social"
                        required
                        disabled={soloAudios}
                        placeholder="Ej: JUAN PEREZ"
                        {...field}
                        error={errorsObj.cliente_nombre?.message}
                      />
                    )}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Controller
                      control={form.control}
                      name="cliente_telefono"
                      render={({ field }) => (
                        <TextInput
                          label="Teléfono"
                          required
                          disabled={soloAudios}
                          type="tel"
                          placeholder="9XXXXXXXX"
                          {...field}
                          error={errorsObj.cliente_telefono?.message}
                        />
                      )}
                    />
                    <Controller
                      control={form.control}
                      name="cliente_email"
                      render={({ field }) => (
                        <TextInput
                          label="Email"
                          required
                          disabled={soloAudios}
                          type="email"
                          placeholder="cliente@correo.com"
                          {...field}
                          error={errorsObj.cliente_email?.message}
                        />
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Controller
                      control={form.control}
                      name="cliente_fecha_nacimiento"
                      render={({ field }) => (
                        <TextInput
                          label="Fecha Nacimiento"
                          required
                          disabled={soloAudios}
                          type="date"
                          {...field}
                          error={errorsObj.cliente_fecha_nacimiento?.message}
                        />
                      )}
                    />
                    <Controller
                      control={form.control}
                      name="numero_instalacion"
                      render={({ field }) => (
                        <TextInput
                          label="Número Instalación"
                          required
                          disabled={soloAudios}
                          placeholder="Ej: 12345"
                          {...field}
                          error={errorsObj.numero_instalacion?.message}
                        />
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Controller
                      control={form.control}
                      name="cliente_papa"
                      render={({ field }) => (
                        <TextInput
                          label="Nombre del Padre"
                          required
                          disabled={soloAudios}
                          placeholder="Ej: CARLOS"
                          {...field}
                          error={errorsObj.cliente_papa?.message}
                        />
                      )}
                    />
                    <Controller
                      control={form.control}
                      name="cliente_mama"
                      render={({ field }) => (
                        <TextInput
                          label="Nombre de la Madre"
                          required
                          disabled={soloAudios}
                          placeholder="Ej: MARIA"
                          {...field}
                          error={errorsObj.cliente_mama?.message}
                        />
                      )}
                    />
                  </div>
                </div>
              </div>

              {esRUC && (
                <>
                  <Divider />
                  <div>
                    <SectionTitle className="text-purple-500">
                      Representante Legal (RUC)
                    </SectionTitle>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Controller
                        control={form.control}
                        name="representante_legal_dni"
                        render={({ field }) => (
                          <TextInput
                            label="DNI Representante"
                            required
                            disabled={soloAudios}
                            placeholder="12345678"
                            {...field}
                            value={field.value ?? ""}
                            error={errorsObj.representante_legal_dni?.message}
                          />
                        )}
                      />
                      <Controller
                        control={form.control}
                        name="representante_legal_nombre"
                        render={({ field }) => (
                          <TextInput
                            label="Nombre Representante"
                            required
                            disabled={soloAudios}
                            placeholder="NOMBRES APELLIDOS"
                            {...field}
                            value={field.value ?? ""}
                            error={
                              errorsObj.representante_legal_nombre?.message
                            }
                          />
                        )}
                      />
                    </div>
                  </div>
                </>
              )}

              <Divider />

              <div>
                <SectionTitle>Equipos & Grabador</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <Controller
                    control={form.control}
                    name="cant_decos_adicionales"
                    render={({ field }) => (
                      <TextInput
                        label="Decos adicionales"
                        type="number"
                        min="0"
                        disabled={soloAudios}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        value={field.value ?? 0}
                      />
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="cant_repetidores_adicionales"
                    render={({ field }) => (
                      <TextInput
                        label="Repetidores adicionales"
                        type="number"
                        min="0"
                        disabled={soloAudios}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        value={field.value ?? 0}
                      />
                    )}
                  />
                </div>
                <Controller
                  control={form.control}
                  name="id_grabador_audios"
                  render={({ field }) => (
                    <NativeSelect
                      label="Grabador Asignado"
                      required
                      disabled={soloAudios}
                      value={field.value ?? ""}
                      onChange={(v) =>
                        field.onChange(v ? Number(v) : undefined)
                      }
                      placeholder="Seleccione el responsable"
                      error={errorsObj.id_grabador_audios?.message}
                    >
                      {grabadores.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.nombre_completo}
                        </option>
                      ))}
                    </NativeSelect>
                  )}
                />
              </div>
            </div>

            {/* PASO 1: UBICACIÓN */}
            <div
              className={cn(
                "space-y-8 animate-in fade-in duration-300",
                paso !== 1 && "hidden",
                soloAudios && "pointer-events-none opacity-60 grayscale-[20%]", // Bloqueo visual extremo
              )}
            >
              <div>
                <SectionTitle>Ubigeo de Instalación</SectionTitle>
                <Controller
                  control={form.control}
                  name="id_distrito_instalacion"
                  render={({ field }) => (
                    <UbigeoCascada
                      label=""
                      required
                      disabled={soloAudios} // Si el componente hijo lo soporta
                      depId={form.watch("dep_inst_id")}
                      provId={form.watch("prov_inst_id")}
                      distId={field.value}
                      onDepChange={(v) => form.setValue("dep_inst_id", v)}
                      onProvChange={(v) => form.setValue("prov_inst_id", v)}
                      onDistChange={(v) => field.onChange(v)}
                      error={errorsObj.id_distrito_instalacion?.message}
                    />
                  )}
                />
                <div className="mt-4 space-y-4">
                  <Controller
                    control={form.control}
                    name="direccion_detalle"
                    render={({ field }) => (
                      <TextInput
                        label="Dirección Detallada"
                        required
                        disabled={soloAudios}
                        placeholder="Ej: AV LOS INCAS 123 PISO 2"
                        {...field}
                        error={errorsObj.direccion_detalle?.message}
                      />
                    )}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Controller
                      control={form.control}
                      name="plano"
                      render={({ field }) => (
                        <TextInput
                          label="Nro Plano"
                          required
                          disabled={soloAudios}
                          placeholder="PL-XXXXX"
                          {...field}
                          error={errorsObj.plano?.message}
                        />
                      )}
                    />
                    <Controller
                      control={form.control}
                      name="referencias"
                      render={({ field }) => (
                        <TextInput
                          label="Referencias"
                          disabled={soloAudios}
                          placeholder="Cerca al parque..."
                          {...field}
                          value={field.value ?? ""}
                        />
                      )}
                    />
                  </div>
                  <Controller
                    control={form.control}
                    name="coordenadas_gps"
                    render={({ field }) => (
                      <TextInput
                        label="Coordenadas GPS"
                        disabled={soloAudios}
                        placeholder="-12.0464, -77.0428"
                        {...field}
                        value={field.value ?? ""}
                      />
                    )}
                  />
                </div>
              </div>

              <Divider />

              <div>
                <SectionTitle>Ubigeo de Nacimiento</SectionTitle>
                <Controller
                  control={form.control}
                  name="id_distrito_nacimiento"
                  render={({ field }) => (
                    <UbigeoCascada
                      label=""
                      disabled={soloAudios}
                      depId={form.watch("dep_nac_id")}
                      provId={form.watch("prov_nac_id")}
                      distId={field.value}
                      onDepChange={(v) => form.setValue("dep_nac_id", v)}
                      onProvChange={(v) => form.setValue("prov_nac_id", v)}
                      onDistChange={(v) => field.onChange(v)}
                    />
                  )}
                />
              </div>

              <Divider />

              <div>
                <SectionTitle>Evaluación</SectionTitle>
                <div className="space-y-4">
                  <Controller
                    control={form.control}
                    name="es_full_claro"
                    render={({ field }) => (
                      // Como Toggle no soporta disabled nativo, el pointer-events-none superior se encarga
                      <Toggle
                        label="Es Full Claro"
                        description="Cliente activará todos los servicios asociados."
                        checked={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="score_crediticio"
                    render={({ field }) => (
                      <TextInput
                        label="Score Crediticio"
                        disabled={soloAudios}
                        placeholder="Ej: A / B / C"
                        {...field}
                        value={field.value ?? ""}
                      />
                    )}
                  />
                </div>
              </div>
            </div>

            {/* PASO 2: AUDIOS */}
            <div
              className={cn(
                "space-y-6 animate-in fade-in duration-300",
                paso !== 2 && "hidden",
              )}
            >
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex flex-col gap-1">
                <p className="text-sm font-bold text-primary">
                  {esRUC
                    ? "14 audios requeridos (RUC)"
                    : "12 audios requeridos (DNI/CE)"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Sube los archivos en formato .mp3 correspondientes al guión.
                  Usa Drag & Drop.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {etiquetasAudio.map((etiqueta, i) => (
                  <AudioUploadField
                    key={i}
                    etiqueta={etiqueta}
                    index={i}
                    url={audioUrls[i] ?? null}
                    uploading={audioUploading[i] ?? false}
                    error={audioErrors[i] ?? null}
                    isRechazado={audioRechazados[i]}
                    motivoRechazo={audioMotivos[i]}
                    onUploaded={(url) => handleAudioUploaded(i, url)}
                    onRemove={() => handleAudioRemove(i)}
                    onUploadStart={() => handleAudioStart(i)}
                    onUploadError={(err) => handleAudioError(i, err)}
                  />
                ))}
              </div>

              <div className="p-4 rounded-xl bg-card border border-border flex items-center justify-between mt-4">
                <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                  Progreso de Audios
                </span>
                <span
                  className={cn(
                    "text-sm font-mono font-bold",
                    todosAudiosListos ? "text-emerald-500" : "text-primary",
                  )}
                >
                  {audioUrls.filter(Boolean).length} / {etiquetasAudio.length}
                </span>
              </div>
            </div>
          </form>
        </div>

        {/* ── Footer Controles ── */}
        <div className="p-5 border-t border-border bg-card shrink-0 flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-xl px-5 gap-2"
            onClick={paso > 0 ? () => setPaso(paso - 1) : handleClose}
          >
            <ChevronLeft size={16} /> {paso > 0 ? "Atrás" : "Cancelar"}
          </Button>

          {paso < PASOS.length - 1 ? (
            <Button
              type="button"
              className="h-11 rounded-xl px-6 gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
              onClick={() => setPaso(paso + 1)}
            >
              Siguiente <ChevronRight size={16} />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleCustomSubmit} // Usamos nuestra función interceptora
              disabled={isPending || algunoSubiendo}
              className="h-11 rounded-xl px-6 gap-2 bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-500/20 disabled:opacity-50"
            >
              {isPending && <Loader2 size={16} className="animate-spin" />}
              {esEdicion ? "Guardar Corrección" : "Confirmar Venta"}{" "}
              <Check size={16} />
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
