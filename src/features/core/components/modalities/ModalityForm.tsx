import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";

import {
  modalityFormSchema,
  type ModalityFormData,
} from "../../schemas/modalitySchema";
import type { Modality } from "../../types";

interface ModalityFormProps {
  modality: Modality | null;
  isSubmitting: boolean;
  onSave: (data: ModalityFormData) => Promise<void>;
  onCancel: () => void;
}

export function ModalityForm({
  modality,
  isSubmitting,
  onSave,
  onCancel,
}: ModalityFormProps) {
  const form = useForm<ModalityFormData>({
    resolver: zodResolver(modalityFormSchema),
    defaultValues: { nombre: "", activo: true },
  });

  useEffect(() => {
    if (modality) {
      form.reset({
        nombre: modality.nombre,
        activo: modality.activo,
      });
    } else {
      form.reset({ nombre: "", activo: true });
    }
  }, [modality, form]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSave)}
        className="flex flex-col gap-6 p-6 font-sans"
      >
        {/* ── Datos Generales ── */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground mb-4">
            Información
          </p>

          <FormField
            control={form.control}
            name="nombre"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-1.5 space-y-0">
                <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-[0.06em] font-mono">
                  Nombre de la Modalidad
                </label>
                <FormControl>
                  <input
                    placeholder="Ej: CALL CENTER"
                    className={cn(
                      "h-11 bg-background border rounded-xl px-3.5 font-mono text-sm text-foreground transition-all outline-none focus:border-primary focus:ring-4 focus:ring-primary/10",
                      form.formState.errors.nombre
                        ? "border-destructive focus:border-destructive focus:ring-destructive/10"
                        : "border-border",
                    )}
                    {...field}
                    onChange={(e) =>
                      field.onChange(e.target.value.toUpperCase())
                    }
                  />
                </FormControl>
                <FormMessage className="text-[11px] text-destructive flex items-center gap-1 mt-1">
                  {form.formState.errors.nombre && (
                    <>
                      <AlertCircle size={11} />{" "}
                      {form.formState.errors.nombre.message}
                    </>
                  )}
                </FormMessage>
              </FormItem>
            )}
          />
        </div>

        {/* ── Estado ── */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <FormField
            control={form.control}
            name="activo"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between space-y-0">
                <div>
                  <p className="font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground m-0">
                    Estado de Operación
                  </p>
                  <FormDescription className="text-[12px] mt-1 text-muted-foreground/80">
                    Permite o bloquea el uso de esta modalidad en el sistema.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {/* ── Acciones ── */}
        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-sans font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_4px_16px_rgba(var(--primary),0.2)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Guardando...
              </>
            ) : modality ? (
              "Guardar Cambios"
            ) : (
              "Crear Modalidad"
            )}
          </Button>
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={onCancel}
            className="flex-1 h-11 bg-transparent border border-border text-muted-foreground hover:bg-muted hover:text-foreground font-sans font-medium text-sm rounded-xl transition-all"
          >
            Cancelar
          </Button>
        </div>
      </form>
    </Form>
  );
}
