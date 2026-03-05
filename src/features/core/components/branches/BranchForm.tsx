import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2, Check } from "lucide-react";

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
  branchFormSchema,
  type BranchFormData,
} from "../../schemas/branchSchema";
import type { Branch, Modality } from "../../types";

interface BranchFormProps {
  branch: Branch | null;
  modalities: Modality[];
  isSubmitting: boolean;
  onSave: (data: BranchFormData) => Promise<void>;
  onCancel: () => void;
}

export const BranchForm = ({
  branch,
  modalities,
  isSubmitting,
  onSave,
  onCancel,
}: BranchFormProps) => {
  const form = useForm<BranchFormData>({
    resolver: zodResolver(branchFormSchema),
    defaultValues: {
      nombre: "",
      direccion: "",
      activo: true,
      ids_modalidades: [],
    },
  });

  useEffect(() => {
    if (branch) {
      form.reset({
        nombre: branch.nombre,
        direccion: branch.direccion,
        activo: branch.activo,
        ids_modalidades: branch.modalidades.map((m) => m.id),
      });
    } else {
      form.reset({
        nombre: "",
        direccion: "",
        activo: true,
        ids_modalidades: [],
      });
    }
  }, [branch, form]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSave)}
        className="flex flex-col gap-6 p-6 font-sans"
      >
        {/* ── Datos Generales ── */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground mb-4">
            Datos Generales
          </p>
          <div className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-1.5 space-y-0">
                  <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-[0.06em] font-mono">
                    Nombre de la Sucursal
                  </label>
                  <FormControl>
                    <input
                      placeholder="Ej: Jard Digital - Centro"
                      className={cn(
                        "h-11 bg-background border rounded-xl px-3.5 font-sans text-sm text-foreground transition-all outline-none focus:border-primary focus:ring-4 focus:ring-primary/10",
                        form.formState.errors.nombre
                          ? "border-destructive focus:border-destructive focus:ring-destructive/10"
                          : "border-border",
                      )}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-[11px] text-destructive" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="direccion"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-1.5 space-y-0">
                  <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-[0.06em] font-mono">
                    Dirección Física
                  </label>
                  <FormControl>
                    <input
                      placeholder="Av. Principal 123, Chiclayo"
                      className={cn(
                        "h-11 bg-background border rounded-xl px-3.5 font-sans text-sm text-foreground transition-all outline-none focus:border-primary focus:ring-4 focus:ring-primary/10",
                        form.formState.errors.direccion
                          ? "border-destructive"
                          : "border-border",
                      )}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-[11px] text-destructive" />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* ── Modalidades ── */}
        <div className="bg-card border-l-4 border-l-primary border-y border-r border-y-border border-r-border rounded-2xl p-5 shadow-sm">
          <div className="mb-4">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground m-0">
              Modalidades Operativas
            </p>
            <FormDescription className="text-[12px] mt-1">
              Seleccione los tipos de operaciones permitidas en esta sede.
            </FormDescription>
          </div>

          <FormField
            control={form.control}
            name="ids_modalidades"
            render={() => (
              <FormItem>
                <div className="grid grid-cols-1 gap-2.5">
                  {modalities.map((item) => (
                    <FormField
                      key={item.id}
                      control={form.control}
                      name="ids_modalidades"
                      render={({ field }) => {
                        const isChecked = field.value?.includes(item.id);
                        return (
                          <div
                            onClick={() => {
                              const newValue = isChecked
                                ? field.value?.filter((val) => val !== item.id)
                                : [...(field.value || []), item.id];
                              field.onChange(newValue);
                            }}
                            className={cn(
                              "flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all duration-200",
                              isChecked
                                ? "bg-primary/10 border-primary/30 shadow-sm"
                                : "bg-background border-border hover:bg-muted hover:border-primary/20",
                            )}
                          >
                            <div
                              className={cn(
                                "w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors",
                                isChecked
                                  ? "bg-primary border-primary text-primary-foreground"
                                  : "border-muted-foreground/30 bg-card",
                              )}
                            >
                              {isChecked && <Check size={12} strokeWidth={3} />}
                            </div>
                            <span
                              className={cn(
                                "text-[13px] font-medium font-sans transition-colors",
                                isChecked ? "text-primary" : "text-foreground",
                              )}
                            >
                              {item.nombre}
                            </span>
                          </div>
                        );
                      }}
                    />
                  ))}
                </div>
                <FormMessage className="text-[11px] text-destructive flex items-center gap-1 mt-2">
                  {form.formState.errors.ids_modalidades && (
                    <>
                      <AlertCircle size={11} />{" "}
                      {form.formState.errors.ids_modalidades.message}
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
                  <FormDescription className="text-[12px] mt-1">
                    Determina si los asesores pueden loguearse en esta sede.
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
            ) : branch ? (
              "Guardar Cambios"
            ) : (
              "Crear Sucursal"
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
};
