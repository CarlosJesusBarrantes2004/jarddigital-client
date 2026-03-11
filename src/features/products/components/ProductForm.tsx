import { useEffect, memo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  X,
  Package,
  Star,
  AlertTriangle,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { useCreateProducto, useUpdateProducto } from "../hooks/useProductos";
import { Button } from "@/components/ui/button";
import { TIPOS_SOLUCION, type Producto } from "../types/productos.types";

// ── Schema ────────────────────────────────────────────────────────────────────
const schema = z.object({
  nombre_campana: z.string().min(2, "Mín 2 caracteres"),
  tipo_solucion: z.string().min(1, "Selecciona el tipo de solución"),
  nombre_paquete: z.string().min(3, "Mín 3 caracteres"),
  es_alto_valor: z.boolean(),
  costo_fijo_plan: z
    .string()
    .min(1, "Requerido")
    .refine(
      (v) => !isNaN(Number(v)) && Number(v) >= 0,
      "Debe ser un número positivo",
    ),
  comision_base: z
    .string()
    .min(1, "Requerido")
    .refine(
      (v) => !isNaN(Number(v)) && Number(v) >= 0,
      "Debe ser un número positivo",
    ),
  fecha_fin_vigencia: z.string().nullable().optional(),
  activo: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

// ── Helpers UI (Incrustados) ──────────────────────────────────────────────────
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
  accentColorClass = "bg-primary",
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  accentColorClass?: string;
}) {
  return (
    <div
      onClick={() => onChange(!checked)}
      className={cn(
        "flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all duration-200",
        checked
          ? "bg-card border-border shadow-sm"
          : "bg-card/50 border-border hover:bg-muted",
      )}
    >
      <div>
        <p
          className={cn(
            "text-sm font-medium",
            checked ? "text-foreground" : "text-foreground/70",
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
          checked ? accentColorClass : "bg-muted-foreground/30",
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

// ── Preview card ──────────────────────────────────────────────────────────────
const PreviewCard = memo(function PreviewCard({
  values,
}: {
  values: Partial<FormValues>;
}) {
  const costo = Number(values.costo_fijo_plan || 0);
  const comision = Number(values.comision_base || 0);

  return (
    <div className="flex flex-col gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/10 relative overflow-hidden">
      {values.es_alto_valor && (
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#C9975A]/20 blur-3xl rounded-full pointer-events-none" />
      )}

      <div className="flex items-center gap-3 relative z-10">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-background border border-primary/20 shadow-sm shrink-0">
          <Package size={16} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-bold font-serif text-foreground leading-tight truncate">
            {values.nombre_paquete || (
              <span className="text-muted-foreground/70 font-sans font-normal text-[13px]">
                Nombre del paquete…
              </span>
            )}
          </p>
          <p className="text-[11px] text-muted-foreground font-mono mt-0.5 truncate">
            {values.nombre_campana || "—"} · {values.tipo_solucion || "—"}
          </p>
        </div>
        {values.es_alto_valor && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-widest bg-[#C9975A]/10 border border-[#C9975A]/30 text-[#C9975A] shrink-0 uppercase">
            <Star size={10} className="fill-current" /> Alto Valor
          </span>
        )}
      </div>

      <div className="h-px bg-border/50 my-1 relative z-10" />

      <div className="grid grid-cols-2 gap-3 relative z-10">
        <div className="p-3 rounded-xl bg-background/50 border border-border/50">
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">
            Costo fijo
          </p>
          <p className="font-mono text-lg font-bold text-foreground leading-none">
            S/ {costo.toFixed(2)}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
          <p className="text-[10px] font-mono text-emerald-500/70 uppercase tracking-widest mb-1">
            Comisión base
          </p>
          <p className="font-mono text-lg font-bold text-emerald-500 leading-none">
            S/ {comision.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────

interface ProductoFormProps {
  open: boolean;
  onClose: () => void;
  productoParaEditar?: Producto | null;
}

export function ProductoForm({
  open,
  onClose,
  productoParaEditar,
}: ProductoFormProps) {
  const isEdit = !!productoParaEditar;
  const { mutateAsync: crear, isPending: creando } = useCreateProducto();
  const { mutateAsync: editar, isPending: editando } = useUpdateProducto(
    productoParaEditar?.id ?? 0,
  );
  const isPending = creando || editando;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre_campana: "",
      tipo_solucion: "",
      nombre_paquete: "",
      es_alto_valor: false,
      costo_fijo_plan: "",
      comision_base: "",
      fecha_fin_vigencia: null,
      activo: true,
    },
  });

  const watchedValues = form.watch();

  useEffect(() => {
    if (!open) return;
    if (productoParaEditar) {
      form.reset({
        nombre_campana: productoParaEditar.nombre_campana,
        tipo_solucion: productoParaEditar.tipo_solucion,
        nombre_paquete: productoParaEditar.nombre_paquete,
        es_alto_valor: productoParaEditar.es_alto_valor,
        costo_fijo_plan: productoParaEditar.costo_fijo_plan,
        comision_base: productoParaEditar.comision_base,
        fecha_fin_vigencia: productoParaEditar.fecha_fin_vigencia ?? null,
        activo: productoParaEditar.activo,
      });
    } else {
      form.reset({
        nombre_campana: "",
        tipo_solucion: "",
        nombre_paquete: "",
        es_alto_valor: false,
        costo_fijo_plan: "",
        comision_base: "",
        fecha_fin_vigencia: null,
        activo: true,
      });
    }
  }, [open, productoParaEditar, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    const payload = {
      ...values,
      fecha_fin_vigencia: values.fecha_fin_vigencia || null,
    };

    try {
      if (isEdit) {
        await editar(payload);
        toast.success("Producto actualizado correctamente");
      } else {
        await crear(payload);
        toast.success("Producto creado correctamente");
      }
      onClose();
    } catch (err: unknown) {
      const e = err as { response?: { data?: Record<string, unknown> } };
      const data = e?.response?.data;
      if (data) {
        const first = Object.values(data)[0];
        toast.error(Array.isArray(first) ? first[0] : String(first));
      } else {
        toast.error("Error al guardar el producto");
      }
    }
  });

  const handleClose = () => {
    form.reset();
    onClose();
  };

  if (!open) return null;
  const err = form.formState.errors;

  return (
    <>
      <div
        onClick={handleClose}
        className="fixed inset-0 z-[1000] animate-in fade-in duration-300"
      />
      <div className="fixed top-0 right-0 bottom-0 w-full sm:max-w-[560px] bg-card border-l border-border z-[1001] flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        <div className="p-6 border-b border-border bg-card/50 flex items-start justify-between shrink-0">
          <div>
            <p className="font-mono text-[10px] tracking-widest uppercase text-primary mb-1.5 font-bold">
              {isEdit ? "Editar producto" : "Nuevo producto"}
            </p>
            <h2 className="font-serif text-2xl font-bold text-foreground leading-tight">
              {isEdit ? productoParaEditar?.nombre_paquete : "Registrar Plan"}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-background">
          <form id="producto-form" onSubmit={onSubmit} className="space-y-7">
            <PreviewCard values={watchedValues} />

            <div>
              <SectionTitle>Identificación</SectionTitle>
              <div className="flex flex-col gap-4">
                <Controller
                  control={form.control}
                  name="nombre_campana"
                  render={({ field }) => (
                    <TextInput
                      label="Nombre de campaña"
                      required
                      placeholder="Ej: CAMPAÑA FIBRA VERANO 2025"
                      error={err.nombre_campana?.message}
                      {...field}
                    />
                  )}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Controller
                    control={form.control}
                    name="tipo_solucion"
                    render={({ field }) => (
                      <NativeSelect
                        label="Tipo de solución"
                        required
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Seleccionar"
                        error={err.tipo_solucion?.message}
                      >
                        {TIPOS_SOLUCION.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </NativeSelect>
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="nombre_paquete"
                    render={({ field }) => (
                      <TextInput
                        label="Nombre del paquete"
                        required
                        placeholder="Ej: 400 MB CLARO TV STD PRO"
                        error={err.nombre_paquete?.message}
                        {...field}
                      />
                    )}
                  />
                </div>
              </div>
            </div>

            <Divider />

            <div>
              <SectionTitle className="text-emerald-500">
                Precios y Comisiones
              </SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Controller
                  control={form.control}
                  name="costo_fijo_plan"
                  render={({ field }) => (
                    <TextInput
                      label="Costo fijo del plan (S/)"
                      required
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="29.90"
                      error={err.costo_fijo_plan?.message}
                      {...field}
                    />
                  )}
                />
                <Controller
                  control={form.control}
                  name="comision_base"
                  render={({ field }) => (
                    <TextInput
                      label="Comisión base (S/)"
                      required
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="15.00"
                      error={err.comision_base?.message}
                      {...field}
                    />
                  )}
                />
              </div>

              {watchedValues.costo_fijo_plan && watchedValues.comision_base && (
                <div className="flex items-center gap-2 mt-4 px-3.5 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-[11px] text-emerald-500/80 font-medium">
                    Margen de ganancia:
                  </span>
                  <span className="font-mono font-bold text-sm text-emerald-500">
                    {(
                      (Number(watchedValues.comision_base) /
                        Math.max(Number(watchedValues.costo_fijo_plan), 0.01)) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                </div>
              )}
            </div>

            <Divider />

            <div>
              <SectionTitle>Vigencia Comercial</SectionTitle>
              <Controller
                control={form.control}
                name="fecha_fin_vigencia"
                render={({ field }) => (
                  <TextInput
                    label="Fecha de fin de vigencia (opcional)"
                    type="date"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      field.onChange(e.target.value || null)
                    }
                  />
                )}
              />
              <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                Si se deja en blanco, el plan se considera vigente
                indefinidamente hasta su desactivación manual.
              </p>
            </div>

            <Divider />

            <div>
              <SectionTitle>Opciones del Plan</SectionTitle>
              <div className="flex flex-col gap-3">
                <Controller
                  control={form.control}
                  name="es_alto_valor"
                  render={({ field }) => (
                    <Toggle
                      label="Plan de Alto Valor"
                      description="Activa para planes premium — aparecerá destacado con una estrella dorada."
                      checked={field.value}
                      onChange={field.onChange}
                      accentColorClass="bg-[#C9975A]"
                    />
                  )}
                />
                {isEdit && (
                  <Controller
                    control={form.control}
                    name="activo"
                    render={({ field }) => (
                      <Toggle
                        label="Plan Activo"
                        description="Desactívalo para ocultarlo del formulario de ventas sin borrar el historial."
                        checked={field.value}
                        onChange={field.onChange}
                        accentColorClass="bg-primary"
                      />
                    )}
                  />
                )}
              </div>
            </div>
          </form>
        </div>

        <div className="p-5 border-t border-border bg-card shrink-0 flex items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex-1 h-11 rounded-xl bg-transparent border-border"
          >
            Cancelar
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isPending}
            className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg hover:bg-primary/90"
          >
            {isPending && <Loader2 size={16} className="animate-spin mr-2" />}
            {isEdit ? "Guardar cambios" : "Crear producto"}
          </Button>
        </div>
      </div>
    </>
  );
}
