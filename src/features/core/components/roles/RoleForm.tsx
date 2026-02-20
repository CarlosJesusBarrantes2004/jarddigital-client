import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { Role } from "@/features/auth/types";
import type { RolePayload } from "../../types";
import { Textarea } from "@/components/ui/textarea";

const roleSchema = z.object({
  codigo: z.string().min(2, "El código es obligatorio").toUpperCase(),
  nombre: z.string().min(2, "El nombre es obligatorio"),
  descripcion: z.string().optional(),
  nivel_jerarquia: z.coerce.number().min(1).max(5), // Zod convierte el string del input a number
  activo: z.boolean().default(true),
});

type RoleFormData = z.infer<typeof roleSchema>;

interface RoleFormProps {
  role: Role | null;
  onSave: (data: RolePayload) => Promise<void>;
  onCancel: () => void;
}

export function RoleForm({ role, onSave, onCancel }: RoleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
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
        descripcion: (role as any).descripcion || "",
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

  const onSubmit = async (data: RoleFormData) => {
    setIsSubmitting(true);
    await onSave(data);
    setIsSubmitting(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="codigo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Código del Rol</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: SUPERVISOR"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Rol</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Supervisor" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="descripcion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe las responsabilidades..."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="nivel_jerarquia"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nivel Jerárquico</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  placeholder="1 = Mayor jerarquía"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="activo"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Estado Activo</FormLabel>
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

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Guardar"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancelar
          </Button>
        </div>
      </form>
    </Form>
  );
}
