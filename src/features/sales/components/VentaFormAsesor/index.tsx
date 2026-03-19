import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  RefreshCw,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useCreateVenta,
  useUpdateVentaAsesor,
  useTiposDocumento,
  useProductos,
  useGrabadores,
} from "../../hooks/useSales";
import type { Venta, AudioVentaForm } from "../../types/sales.types";
import {
  ETIQUETAS_AUDIO_DNI as ETIQUETAS_DNI,
  ETIQUETAS_AUDIO_RUC as ETIQUETAS_RUC,
} from "../../types/sales.types";
import { UbigeoCascada } from "./UbigeoCascada";
import { AudioUploadField } from "./AudioUploadField";
import { Button } from "@/components/ui/button";
import { extractApiError } from "@/lib/api-errors";

const schema = z
  .object({
    id_producto: z
      .number({ error: "Requerido" })
      .min(1, "Selecciona un producto"),
    tecnologia: z
      .string({ error: "Requerido" })
      .min(1, "Selecciona tecnología"),
    id_tipo_documento: z
      .number({ error: "Requerido" })
      .min(1, "Selecciona tipo de documento"),
    cliente_numero_doc: z.string().min(1, "Número requerido"),
    cliente_nombre: z.string().min(2, "Nombre muy corto"),
    cliente_telefono: z.string().min(7, "Teléfono inválido"),
    cliente_email: z.string().email("Email inválido"),
    cliente_fecha_nacimiento: z.string().min(1, "Fecha requerida"),
    cliente_genero: z.string().min(1, "Selecciona el género"),
    cliente_papa: z.string().min(2, "Nombre del padre requerido"),
    cliente_mama: z.string().min(2, "Nombre de la madre requerido"),
    numero_instalacion: z.string().min(1, "Número de instalación requerido"),

    cant_decos_adicionales: z.number().optional().default(0),
    cant_repetidores_adicionales: z.number().optional().default(0),

    representante_legal_dni: z.string().optional(),
    representante_legal_nombre: z.string().optional(),

    // Campos auxiliares de ubigeo — solo para el form, no van al backend
    dep_inst_id: z.number().optional(),
    prov_inst_id: z.number().optional(),
    // optional() sin refine: la validación de "requerido" se hace en handleCustomSubmit
    id_distrito_instalacion: z.number().optional(),

    dep_nac_id: z.number().optional(),
    prov_nac_id: z.number().optional(),
    id_distrito_nacimiento: z.number().optional(),

    referencias: z.string().optional(),
    plano: z.string().min(1, "Requerido"),
    direccion_detalle: z.string().min(5, "Dirección requerida"),
    coordenadas_gps: z.string().optional(),
    es_full_claro: z.boolean().default(false),
    score_crediticio: z.string().optional(),

    id_grabador_audios: z
      .number({ error: "Selecciona un grabador" })
      .min(1, "Selecciona un grabador"),
    nombre_grabador_externo: z.string().optional(),

    audio_urls: z.array(z.string().optional()).optional(),
  })
  .refine(
    (d) => {
      const esRuc = d.id_tipo_documento === 3;
      if (
        esRuc &&
        (!d.representante_legal_dni || d.representante_legal_dni.trim() === "")
      )
        return false;
      return true;
    },
    { message: "Requerido para RUC", path: ["representante_legal_dni"] },
  )
  .refine(
    (d) => {
      const esRuc = d.id_tipo_documento === 3;
      if (
        esRuc &&
        (!d.representante_legal_nombre ||
          d.representante_legal_nombre.trim() === "")
      )
        return false;
      return true;
    },
    { message: "Requerido para RUC", path: ["representante_legal_nombre"] },
  )
  .refine(
    (d) => {
      if (
        d.id_grabador_audios === 1 &&
        (!d.nombre_grabador_externo || d.nombre_grabador_externo.trim() === "")
      )
        return false;
      return true;
    },
    { message: "Especifica el nombre", path: ["nombre_grabador_externo"] },
  );

type FormValues = z.infer<typeof schema>;

// Tipo local para los audios del payload — reemplaza schema._type que no existe en Zod v4
type AudioPayloadItem = {
  id?: number;
  nombre_etiqueta: string;
  url_audio: string;
};

// ─────────────────────────────────────────────────────────────────────────────

const PASOS = [
  { id: "cliente", label: "Cliente", icon: User },
  { id: "ubicacion", label: "Ubicación", icon: MapPin },
  { id: "audios", label: "Audios", icon: Mic },
];

function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-1.5 flex items-center">
      {children}
      {required && (
        <span className="text-destructive ml-1 text-[14px] leading-none">
          *
        </span>
      )}
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
        <p className="text-[11px] text-destructive mt-1 flex items-start gap-1">
          <AlertTriangle size={12} className="shrink-0 mt-0.5" />{" "}
          <span>{error}</span>
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
            "w-full h-11 pl-3.5 pr-10 rounded-xl bg-background border text-sm font-sans outline-none appearance-none transition-all duration-200 focus:ring-4 focus:ring-primary/10",
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
        <p className="text-[11px] text-destructive mt-1 flex items-start gap-1">
          <AlertTriangle size={12} className="shrink-0 mt-0.5" />{" "}
          <span>{error}</span>
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

  const esRechazada = ventaOrigen?.codigo_estado?.toUpperCase() === "RECHAZADO";
  const esReingreso = !!ventaOrigen && esRechazada;
  const esEdicion = !!ventaOrigen && !esRechazada;
  const esEjecucion = ventaOrigen?.codigo_estado?.toUpperCase() === "EJECUCION";
  const soloAudios = esEdicion && esEjecucion;
  const esVentaNuevaPura = !ventaOrigen;

  const { mutateAsync: crearVenta, isPending: creando } = useCreateVenta();
  const { mutateAsync: editarVenta, isPending: editando } =
    useUpdateVentaAsesor(ventaOrigen?.id ?? 0);
  const isPending = creando || editando;

  const { data: tiposDoc = [] } = useTiposDocumento();
  const { data: productos = [] } = useProductos();
  const grabadorActualId = ventaOrigen?.id_grabador_audios ?? null;
  const { data: grabadores = [] } = useGrabadores(grabadorActualId);

  const [filtroCampana, setFiltroCampana] = useState("");
  const [filtroSolucion, setFiltroSolucion] = useState("");

  const [audioIds, setAudioIds] = useState<(number | undefined)[]>([]);
  const [audioUrls, setAudioUrls] = useState<(string | null)[]>([]);
  const [audioTokens, setAudioTokens] = useState<(string | undefined)[]>([]);
  const [audioUploading, setAudioUploading] = useState<boolean[]>([]);
  const [audioErrors, setAudioErrors] = useState<(string | null)[]>([]);
  const [audioRechazados, setAudioRechazados] = useState<boolean[]>([]);
  const [audioMotivos, setAudioMotivos] = useState<(string | null)[]>([]);

  const isInitialMount = useRef(true);
  const prevLengthRef = useRef(0);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    mode: "onSubmit",
    defaultValues: {
      cant_decos_adicionales: 0,
      cant_repetidores_adicionales: 0,
      es_full_claro: false,
      audio_urls: [],
      dep_inst_id: undefined,
      prov_inst_id: undefined,
      id_distrito_instalacion: undefined,
      dep_nac_id: undefined,
      prov_nac_id: undefined,
      id_distrito_nacimiento: undefined,
      cliente_genero: "",
    },
  });

  const watchedValues = form.watch();
  const tipoDocId = form.watch("id_tipo_documento");
  const tipoDoc = tiposDoc.find((t) => t.id === tipoDocId);
  const esRUC = tipoDoc?.codigo?.toUpperCase() === "RUC";
  const etiquetasAudio = esRUC ? ETIQUETAS_RUC : ETIQUETAS_DNI;
  const isGrabadorOtros = form.watch("id_grabador_audios") === 1;

  const campanasDisponibles = useMemo(() => {
    return Array.from(
      new Set(productos.map((p) => p.nombre_campana).filter(Boolean)),
    );
  }, [productos]);

  const solucionesDisponibles = useMemo(() => {
    if (!filtroCampana) return [];
    return Array.from(
      new Set(
        productos
          .filter((p) => p.nombre_campana === filtroCampana)
          .map((p) => p.tipo_solucion)
          .filter(Boolean),
      ),
    );
  }, [productos, filtroCampana]);

  const productosFiltrados = useMemo(() => {
    if (!filtroCampana || !filtroSolucion) return [];
    return productos.filter(
      (p) =>
        p.nombre_campana === filtroCampana &&
        p.tipo_solucion === filtroSolucion,
    );
  }, [productos, filtroCampana, filtroSolucion]);

  // ── INICIALIZACIÓN ──
  useEffect(() => {
    if (!open) return;

    if (ventaOrigen) {
      isInitialMount.current = true;
      const v = ventaOrigen;

      if (esEdicion && v.codigo_estado?.toUpperCase() === "EJECUCION")
        setPaso(2);
      else setPaso(0);

      if (v.id_producto && productos.length > 0) {
        const prod = productos.find((p) => p.id === v.id_producto);
        if (prod) {
          setFiltroCampana(prod.nombre_campana || "");
          setFiltroSolucion(prod.tipo_solucion || "");
        }
      }

      let nombreExterno = "";
      if (v.id_grabador_audios === 1 && v.grabador_real) {
        nombreExterno = v.grabador_real.replace(" (Externo)", "");
      }

      form.reset({
        id_producto: v.id_producto,
        tecnologia: v.tecnologia,
        id_tipo_documento: v.id_tipo_documento,
        cliente_numero_doc: v.cliente_numero_doc,
        cliente_nombre: v.cliente_nombre,
        cliente_telefono: v.cliente_telefono,
        cliente_email: v.cliente_email,
        cliente_fecha_nacimiento:
          v.cliente_fecha_nacimiento?.split("T")[0] ?? "",
        cliente_genero: v.cliente_genero ?? "",
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
        nombre_grabador_externo: nombreExterno,
        // FIX ERROR 2: usamos undefined en lugar de null para campos opcionales
        dep_inst_id: undefined,
        prov_inst_id: undefined,
        id_distrito_instalacion: v.id_distrito_instalacion,
        dep_nac_id: undefined,
        prov_nac_id: undefined,
        // id_distrito_nacimiento puede ser null en la BD, lo convertimos a undefined
        id_distrito_nacimiento: v.id_distrito_nacimiento ?? undefined,
        audio_urls: [],
      });

      const isOrigenRuc =
        tiposDoc
          .find((t) => t.id === v.id_tipo_documento)
          ?.codigo?.toUpperCase() === "RUC";
      const etiquetasReales = isOrigenRuc ? ETIQUETAS_RUC : ETIQUETAS_DNI;
      prevLengthRef.current = etiquetasReales.length;

      const newUrls: (string | null)[] = Array(etiquetasReales.length).fill(
        null,
      );
      const newIds: (number | undefined)[] = Array(etiquetasReales.length).fill(
        undefined,
      );
      const newRechazados: boolean[] = Array(etiquetasReales.length).fill(
        false,
      );
      const newMotivos: (string | null)[] = Array(etiquetasReales.length).fill(
        null,
      );

      etiquetasReales.forEach((etiqueta, i) => {
        const audioDB = v.audios.find((a) => a.nombre_etiqueta === etiqueta);
        if (audioDB) {
          newUrls[i] = audioDB.url_audio;
          newIds[i] = esReingreso ? undefined : audioDB.id;
          newRechazados[i] = audioDB.conforme === false;
          newMotivos[i] = audioDB.motivo;
        }
      });

      setAudioUrls(newUrls);
      setAudioIds(newIds);
      setAudioTokens(Array(etiquetasReales.length).fill(undefined));
      setAudioRechazados(newRechazados);
      setAudioMotivos(newMotivos);
      setAudioUploading(Array(etiquetasReales.length).fill(false));
      setAudioErrors(Array(etiquetasReales.length).fill(null));
      setTimeout(() => {
        isInitialMount.current = false;
      }, 500);
    } else {
      isInitialMount.current = true;
      setPaso(0);
      const draftStr = sessionStorage.getItem("jard_venta_draft");

      if (draftStr) {
        try {
          const parsed = JSON.parse(draftStr);
          form.reset(parsed.form);
          setFiltroCampana(parsed.campana || "");
          setFiltroSolucion(parsed.solucion || "");
          const docTypeDraft = tiposDoc
            .find((t) => t.id === parsed.form.id_tipo_documento)
            ?.codigo?.toUpperCase();
          const draftLength =
            docTypeDraft === "RUC"
              ? ETIQUETAS_RUC.length
              : ETIQUETAS_DNI.length;
          prevLengthRef.current = draftLength;
          if (parsed.audios && parsed.audios.length === draftLength) {
            setAudioUrls(parsed.audios);
            setAudioTokens(parsed.tokens || Array(draftLength).fill(undefined));
            setAudioIds(Array(draftLength).fill(undefined));
            setAudioRechazados(Array(draftLength).fill(false));
            setAudioMotivos(Array(draftLength).fill(null));
            setAudioUploading(Array(draftLength).fill(false));
            setAudioErrors(Array(draftLength).fill(null));
          } else {
            setAudioUrls(Array(draftLength).fill(null));
            setAudioTokens(Array(draftLength).fill(undefined));
          }
        } catch (e) {
          console.error("Error parseando borrador", e);
        }
      } else {
        form.reset();
        setFiltroCampana("");
        setFiltroSolucion("");
        setAudioUrls(Array(etiquetasAudio.length).fill(null));
        setAudioTokens(Array(etiquetasAudio.length).fill(undefined));
        prevLengthRef.current = etiquetasAudio.length;
      }
      setTimeout(() => {
        isInitialMount.current = false;
      }, 500);
    }
  }, [open, ventaOrigen, esEdicion, esReingreso, productos, form, tiposDoc]);

  useEffect(() => {
    if (isInitialMount.current) return;
    if (prevLengthRef.current !== etiquetasAudio.length) {
      setAudioUrls(Array(etiquetasAudio.length).fill(null));
      setAudioIds(Array(etiquetasAudio.length).fill(undefined));
      setAudioTokens(Array(etiquetasAudio.length).fill(undefined));
      setAudioRechazados(Array(etiquetasAudio.length).fill(false));
      setAudioMotivos(Array(etiquetasAudio.length).fill(null));
      prevLengthRef.current = etiquetasAudio.length;
    }
  }, [etiquetasAudio.length]);

  useEffect(() => {
    if (open && esVentaNuevaPura && !isInitialMount.current) {
      const timer = setTimeout(() => {
        sessionStorage.setItem(
          "jard_venta_draft",
          JSON.stringify({
            form: form.getValues(),
            audios: audioUrls,
            tokens: audioTokens,
            campana: filtroCampana,
            solucion: filtroSolucion,
          }),
        );
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [
    open,
    esVentaNuevaPura,
    watchedValues,
    audioUrls,
    audioTokens,
    filtroCampana,
    filtroSolucion,
    form,
  ]);

  const handleLimpiarBorrador = () => {
    sessionStorage.removeItem("jard_venta_draft");
    form.reset({
      cant_decos_adicionales: 0,
      cant_repetidores_adicionales: 0,
      es_full_claro: false,
      cliente_genero: "",
    });
    setFiltroCampana("");
    setFiltroSolucion("");
    setAudioUrls(Array(etiquetasAudio.length).fill(null));
    setAudioTokens(Array(etiquetasAudio.length).fill(undefined));
    setPaso(0);
    toast.success("Borrador limpiado correctamente");
  };

  const handleClose = () => {
    form.reset();
    setPaso(0);
    setAudioUrls([]);
    setFiltroCampana("");
    setFiltroSolucion("");
    onClose();
  };

  const handleAudioUploaded = useCallback(
    (i: number, url: string, token?: string) => {
      setAudioUrls((p) => {
        const n = [...p];
        n[i] = url;
        return n;
      });
      setAudioTokens((p) => {
        const n = [...p];
        n[i] = token;
        return n;
      });
      setAudioUploading((p) => {
        const n = [...p];
        n[i] = false;
        return n;
      });
      setAudioErrors((p) => {
        const n = [...p];
        n[i] = null;
        return n;
      });
    },
    [],
  );

  const handleAudioRemove = useCallback((i: number) => {
    setAudioUrls((p) => {
      const n = [...p];
      n[i] = null;
      return n;
    });
    setAudioTokens((p) => {
      const n = [...p];
      n[i] = undefined;
      return n;
    });
    setAudioRechazados((p) => {
      const n = [...p];
      n[i] = false;
      return n;
    });
  }, []);

  const handleAudioStart = useCallback((i: number) => {
    setAudioUploading((p) => {
      const n = [...p];
      n[i] = true;
      return n;
    });
    setAudioErrors((p) => {
      const n = [...p];
      n[i] = null;
      return n;
    });
  }, []);

  const handleAudioError = useCallback((i: number, err: string) => {
    setAudioUploading((p) => {
      const n = [...p];
      n[i] = false;
      return n;
    });
    setAudioErrors((p) => {
      const n = [...p];
      n[i] = err;
      return n;
    });
  }, []);

  const algunoSubiendo = audioUploading.some(Boolean);

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (algunoSubiendo) {
      toast.error("Espera a que terminen de subir los audios antes de guardar");
      return;
    }

    // Validación manual del distrito de instalación (fuera del schema para evitar
    // el conflicto de tipos con react-hook-form)
    const values = form.getValues();
    if (!soloAudios && !values.id_distrito_instalacion) {
      form.setError("id_distrito_instalacion", {
        message: "Selecciona un distrito",
      });
      setPaso(1);
      toast.error("Por favor, selecciona el distrito de instalación.");
      return;
    }

    const isValid = await form.trigger();
    if (!isValid) {
      const errors = form.formState.errors;
      const paso0Fields = [
        "id_producto",
        "tecnologia",
        "id_tipo_documento",
        "cliente_numero_doc",
        "cliente_nombre",
        "cliente_telefono",
        "cliente_email",
        "cliente_fecha_nacimiento",
        "cliente_genero",
        "cliente_papa",
        "cliente_mama",
        "numero_instalacion",
        "representante_legal_dni",
        "representante_legal_nombre",
        "id_grabador_audios",
        "nombre_grabador_externo",
      ];
      const paso1Fields = [
        "id_distrito_instalacion",
        "plano",
        "direccion_detalle",
      ];
      let primerPasoConError = 0;
      if (Object.keys(errors).some((k) => paso0Fields.includes(k)))
        primerPasoConError = 0;
      else if (Object.keys(errors).some((k) => paso1Fields.includes(k)))
        primerPasoConError = 1;
      setPaso(primerPasoConError);
      toast.error("Por favor, revisa los campos en rojo antes de continuar.");
      return;
    }

    // FIX ERROR 3: usamos AudioPayloadItem en lugar de schema._type
    const audiosPayload: AudioPayloadItem[] = etiquetasAudio
      .map((etiqueta, i) => ({
        id: audioIds[i], // number | undefined
        nombre_etiqueta: etiqueta,
        url_audio: audioUrls[i], // string | null
      }))
      .filter((a) => a.url_audio !== null) // descarta los null en runtime
      .map((a) => ({
        ...(a.id !== undefined && { id: a.id }), // solo incluye id si existe
        nombre_etiqueta: a.nombre_etiqueta,
        url_audio: a.url_audio as string, // seguro porque filtramos null arriba
      }));

    // AudioVentaForm[] para el API (sin el campo id)
    const audiosApi: AudioVentaForm[] = audiosPayload.map((a) => ({
      nombre_etiqueta: a.nombre_etiqueta,
      url_audio: a.url_audio,
    }));

    if (soloAudios) {
      try {
        await editarVenta({ audios: audiosApi });
        toast.success("Audios corregidos y enviados al Backoffice");
        handleClose();
      } catch (err) {
        toast.error(extractApiError(err));
      }
      return;
    }

    // FIX ERROR 4: id_distrito_instalacion es number | undefined en el schema,
    // pero el payload del API espera number. Lo casteamos tras validar que existe.
    const distritoInstalacion = values.id_distrito_instalacion as number;

    try {
      const payload = {
        ...values,
        representante_legal_dni: esRUC
          ? (values.representante_legal_dni ?? null)
          : null,
        representante_legal_nombre: esRUC
          ? (values.representante_legal_nombre ?? null)
          : null,
        id_distrito_instalacion: distritoInstalacion,
        // FIX ERROR 4: id_distrito_nacimiento es number | undefined → convertimos a null para el API
        id_distrito_nacimiento: values.id_distrito_nacimiento ?? null,
        nombre_grabador_externo:
          values.id_grabador_audios === 1
            ? (values.nombre_grabador_externo ?? null)
            : null,
        audios: audiosApi,
      };

      if (esEdicion) {
        await editarVenta(payload);
        toast.success("Venta actualizada y enviada al Backoffice");
      } else {
        await crearVenta({
          ...payload,
          venta_origen: esReingreso ? ventaOrigen!.id : undefined,
        });
        toast.success(
          esReingreso
            ? "Venta reingresada correctamente"
            : "Venta creada correctamente",
        );
        if (esVentaNuevaPura) sessionStorage.removeItem("jard_venta_draft");
      }
      handleClose();
    } catch (err) {
      toast.error(extractApiError(err));
    }
  };

  if (!open) return null;
  const errorsObj = form.formState.errors;

  // FIX ERROR 4: UbigeoCascada espera number | null, pero form.watch devuelve
  // number | undefined cuando el campo es optional(). Normalizamos con ?? null.
  const depInstId = form.watch("dep_inst_id") ?? null;
  const provInstId = form.watch("prov_inst_id") ?? null;
  const depNacId = form.watch("dep_nac_id") ?? null;
  const provNacId = form.watch("prov_nac_id") ?? null;

  return (
    <>
      <div
        onClick={handleClose}
        className="fixed inset-0 z-[1000] animate-in fade-in duration-300"
      />

      <div className="fixed top-0 right-0 bottom-0 w-full sm:max-w-3xl bg-card border-l border-border z-[1001] flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* ── Header ── */}
        <div className="p-6 border-b border-border bg-card/50 flex flex-col shrink-0">
          <div className="flex items-start justify-between">
            <div className="w-full pr-4">
              {esEdicion && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest bg-orange-500/10 text-orange-500 border border-orange-500/30 mb-2">
                  <AlertTriangle size={10} /> CORRECCIÓN SOLICITADA
                </span>
              )}
              {esReingreso && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest bg-primary/10 text-primary border border-primary/30 mb-2">
                  <RefreshCw size={10} /> REINGRESO DE VENTA RECHAZADA
                </span>
              )}
              <h2 className="font-serif text-2xl font-bold text-foreground leading-tight tracking-tight flex items-center gap-3">
                {esEdicion
                  ? "Corregir Venta"
                  : esReingreso
                    ? "Nuevo Reingreso"
                    : "Nueva Venta Claro"}
                {esVentaNuevaPura && (
                  <span className="text-[9px] font-sans font-normal text-muted-foreground bg-muted px-2 py-1 rounded-md ml-2">
                    Borrador autoguardado 💾
                  </span>
                )}
              </h2>
              {esEdicion && ventaOrigen?.comentario_gestion && (
                <div className="mt-3 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                  <p className="text-xs text-orange-600 dark:text-orange-400 leading-snug">
                    <strong className="font-bold uppercase tracking-wider text-[10px] block mb-1">
                      Motivo de corrección:
                    </strong>
                    {ventaOrigen.comentario_gestion}
                  </p>
                </div>
              )}
              {esReingreso && ventaOrigen?.comentario_gestion && (
                <div className="mt-3 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                  <p className="text-xs text-destructive leading-snug">
                    <strong className="font-bold uppercase tracking-wider text-[10px] block mb-1">
                      Motivo del rechazo original:
                    </strong>
                    {ventaOrigen.comentario_gestion}
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors shrink-0"
            >
              <X size={16} />
            </button>
          </div>
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
            const paso0Fields = [
              "id_producto",
              "tecnologia",
              "id_tipo_documento",
              "cliente_numero_doc",
              "cliente_nombre",
              "cliente_telefono",
              "cliente_email",
              "cliente_fecha_nacimiento",
              "cliente_genero",
              "cliente_papa",
              "cliente_mama",
              "numero_instalacion",
              "representante_legal_dni",
              "representante_legal_nombre",
              "id_grabador_audios",
              "nombre_grabador_externo",
            ];
            const paso1Fields = [
              "id_distrito_instalacion",
              "plano",
              "direccion_detalle",
            ];
            const hasError =
              (i === 0 &&
                Object.keys(errorsObj).some((k) => paso0Fields.includes(k))) ||
              (i === 1 &&
                Object.keys(errorsObj).some((k) => paso1Fields.includes(k)));
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
                  completo && !hasError
                    ? "text-emerald-500"
                    : hasError
                      ? "text-destructive"
                      : !activo && "text-muted-foreground",
                )}
              >
                {completo && !hasError ? (
                  <Check size={16} />
                ) : hasError ? (
                  <AlertTriangle size={14} />
                ) : (
                  <Icon size={16} />
                )}
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
                soloAudios && "pointer-events-none opacity-60 grayscale-[20%]",
              )}
            >
              <div>
                <SectionTitle>Plan y Tecnología</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <NativeSelect
                    label="1. Seleccionar Campaña"
                    disabled={soloAudios}
                    value={filtroCampana}
                    onChange={(v) => {
                      setFiltroCampana(v);
                      setFiltroSolucion("");
                      form.resetField("id_producto");
                    }}
                    placeholder="Elegir campaña..."
                  >
                    {campanasDisponibles.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </NativeSelect>
                  <NativeSelect
                    label="2. Tipo de solución"
                    disabled={!filtroCampana || soloAudios}
                    value={filtroSolucion}
                    onChange={(v) => {
                      setFiltroSolucion(v);
                      form.resetField("id_producto");
                    }}
                    placeholder="Elegir solución..."
                  >
                    {solucionesDisponibles.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Controller
                    control={form.control}
                    name="id_producto"
                    render={({ field }) => (
                      <NativeSelect
                        label="3. Producto Final"
                        required
                        disabled={!filtroSolucion || soloAudios}
                        value={field.value ?? ""}
                        onChange={(v) =>
                          field.onChange(v ? Number(v) : undefined)
                        }
                        placeholder="Seleccione el plan..."
                        error={errorsObj.id_producto?.message}
                      >
                        {productosFiltrados.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nombre_paquete}
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
                      name="cliente_genero"
                      render={({ field }) => (
                        <NativeSelect
                          label="Género"
                          required
                          disabled={soloAudios}
                          value={field.value ?? ""}
                          onChange={(v) => field.onChange(v)}
                          placeholder="Seleccionar género..."
                          error={errorsObj.cliente_genero?.message}
                        >
                          <option value="MASCULINO">Masculino</option>
                          <option value="FEMENINO">Femenino</option>
                          <option value="OTRO">
                            Otro / Prefiero no decirlo
                          </option>
                        </NativeSelect>
                      )}
                    />
                  </div>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  {isGrabadorOtros && (
                    <Controller
                      control={form.control}
                      name="nombre_grabador_externo"
                      render={({ field }) => (
                        <TextInput
                          label="Nombre del Grabador"
                          required
                          disabled={soloAudios}
                          placeholder="Ej: JUAN PEREZ"
                          {...field}
                          value={field.value ?? ""}
                          error={errorsObj.nombre_grabador_externo?.message}
                        />
                      )}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* PASO 1: UBICACIÓN */}
            <div
              className={cn(
                "space-y-8 animate-in fade-in duration-300",
                paso !== 1 && "hidden",
                soloAudios && "pointer-events-none opacity-60 grayscale-[20%]",
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
                      disabled={soloAudios}
                      depId={depInstId}
                      provId={provInstId}
                      // FIX ERROR 4: field.value es number | undefined → convertimos a null para UbigeoCascada
                      distId={field.value ?? null}
                      onDepChange={(v) =>
                        form.setValue("dep_inst_id", v ?? undefined)
                      }
                      onProvChange={(v) =>
                        form.setValue("prov_inst_id", v ?? undefined)
                      }
                      onDistChange={(v) => field.onChange(v ?? undefined)}
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
                      depId={depNacId}
                      provId={provNacId}
                      distId={field.value ?? null}
                      onDepChange={(v) =>
                        form.setValue("dep_nac_id", v ?? undefined)
                      }
                      onProvChange={(v) =>
                        form.setValue("prov_nac_id", v ?? undefined)
                      }
                      onDistChange={(v) => field.onChange(v ?? undefined)}
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
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-primary">
                    {esRUC ? "14 audios (RUC)" : "12 audios (DNI/CE)"}
                  </p>
                  <span className="text-[10px] font-mono font-bold px-2 py-1 bg-amber-500/10 text-amber-600 rounded-md border border-amber-500/20">
                    Opcional ahora
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Sube los archivos en formato .mp3 correspondientes al guión.
                  Puedes guardar la venta y subir los audios más tarde
                  editándola.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {etiquetasAudio.map((etiqueta, i) => (
                  <AudioUploadField
                    key={i}
                    etiqueta={etiqueta}
                    index={i}
                    url={audioUrls[i] ?? null}
                    deleteToken={audioTokens[i]}
                    uploading={audioUploading[i] ?? false}
                    error={audioErrors[i] ?? null}
                    isRechazado={audioRechazados[i]}
                    motivoRechazo={audioMotivos[i]}
                    onUploaded={(url, token) =>
                      handleAudioUploaded(i, url, token)
                    }
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
                <span className="text-sm font-mono font-bold text-primary">
                  {audioUrls.filter(Boolean).length} / {etiquetasAudio.length}
                </span>
              </div>
            </div>
          </form>
        </div>

        {/* ── Footer ── */}
        <div className="p-5 border-t border-border bg-card shrink-0 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 flex-1">
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl px-4 sm:px-5 gap-2"
              onClick={paso > 0 ? () => setPaso(paso - 1) : handleClose}
            >
              <ChevronLeft size={16} />
              <span className="hidden sm:inline">
                {paso > 0 ? "Atrás" : "Cancelar"}
              </span>
            </Button>
            {esVentaNuevaPura && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleLimpiarBorrador}
                className="h-11 rounded-xl px-4 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                title="Borrar todos los datos ingresados"
              >
                <Trash2 size={16} className="sm:mr-2" />
                <span className="hidden sm:inline text-xs">Limpiar</span>
              </Button>
            )}
          </div>
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
              onClick={handleCustomSubmit}
              disabled={isPending || algunoSubiendo}
              className="h-11 rounded-xl px-6 gap-2 bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-500/20 disabled:opacity-50"
            >
              {isPending && <Loader2 size={16} className="animate-spin" />}
              {esEdicion
                ? "Guardar Corrección"
                : esReingreso
                  ? "Confirmar Reingreso"
                  : "Guardar Venta"}{" "}
              <Check size={16} />
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
