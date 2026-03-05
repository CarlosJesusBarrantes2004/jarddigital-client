import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";

import { roleFormSchema, type RoleFormData } from "../../schemas/roleSchema";
import type { Role } from "../../types";

interface RoleFormProps {
  role: Role | null;
  isSubmitting: boolean;
  onSave: (data: RoleFormData) => Promise<void>;
  onCancel: () => void;
}

export function RoleForm({
  role,
  isSubmitting,
  onSave,
  onCancel,
}: RoleFormProps) {
  const form = useForm<RoleFormData>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      codigo: "",
      nombre: "",
      descripcion: "",
      nivel_jerarquia: 1,
      activo: true,
    },
  });

  useEffect(() => {
    if (role) {
      form.reset({
        codigo: role.codigo,
        nombre: role.nombre,
        descripcion: role.descripcion || "",
        nivel_jerarquia: role.nivel_jerarquia,
        activo: role.activo,
      });
    } else {
      form.reset({
        codigo: "",
        nombre: "",
        descripcion: "",
        nivel_jerarquia: 1,
        activo: true,
      });
    }
  }, [role, form]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSave)}
        className="flex flex-col gap-6 p-6 font-sans"
      >
        {/* ── Identificación del Rol ── */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground mb-4">
            Estructura del Rol
          </p>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="codigo"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-1.5 space-y-0">
                  <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-[0.06em] font-mono">
                    Código Interno
                  </label>
                  <FormControl>
                    <input
                      placeholder="Ej: ASESOR"
                      className={cn(
                        "h-11 bg-background border rounded-xl px-3.5 font-mono text-sm text-foreground transition-all outline-none focus:border-primary focus:ring-4 focus:ring-primary/10",
                        form.formState.errors.codigo
                          ? "border-destructive focus:border-destructive"
                          : "border-border",
                      )}
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.value.toUpperCase())
                      }
                    />
                  </FormControl>
                  <FormMessage className="text-[11px] text-destructive flex items-center gap-1" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nivel_jerarquia"
              render={({ field }) => {
                const isOwner = role?.codigo === "DUENO";

                return (
                  <FormItem className="flex flex-col gap-1.5 space-y-0">
                    <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-[0.06em] font-mono">
                      Nivel Jerárquico
                    </label>
                    <FormControl>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        placeholder="1 = Mayor"
                        disabled={isOwner}
                        className={cn(
                          "h-11 bg-background border rounded-xl px-3.5 font-mono text-sm text-foreground transition-all outline-none focus:border-primary focus:ring-4 focus:ring-primary/10",
                          form.formState.errors.nivel_jerarquia
                            ? "border-destructive"
                            : "border-border",
                        )}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-[11px] text-destructive flex items-center gap-1" />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-1.5 space-y-0 col-span-2">
                  <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-[0.06em] font-mono">
                    Nombre Público
                  </label>
                  <FormControl>
                    <input
                      placeholder="Ej: Asesor de Ventas"
                      className={cn(
                        "h-11 bg-background border rounded-xl px-3.5 font-sans text-sm text-foreground transition-all outline-none focus:border-primary focus:ring-4 focus:ring-primary/10",
                        form.formState.errors.nombre
                          ? "border-destructive"
                          : "border-border",
                      )}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-[11px] text-destructive flex items-center gap-1" />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* ── Detalles Adicionales ── */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground mb-4">
            Detalles
          </p>

          <FormField
            control={form.control}
            name="descripcion"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-1.5 space-y-0">
                <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-[0.06em] font-mono">
                  Descripción de Responsabilidades
                </label>
                <FormControl>
                  <Textarea
                    placeholder="Describe brevemente las capacidades de este rol en el sistema..."
                    className={cn(
                      "min-h-[80px] bg-background border rounded-xl p-3.5 font-sans text-[13px] text-foreground transition-all outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 resize-none",
                      form.formState.errors.descripcion
                        ? "border-destructive"
                        : "border-border",
                    )}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-[11px] text-destructive flex items-center gap-1" />
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
                    Rol Activo
                  </p>
                  <FormDescription className="text-[12px] mt-1 text-muted-foreground/80">
                    Determina si este rol puede ser asignado a nuevos usuarios.
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
            ) : role ? (
              "Guardar Cambios"
            ) : (
              "Crear Rol"
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
