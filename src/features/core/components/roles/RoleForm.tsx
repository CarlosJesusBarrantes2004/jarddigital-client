import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

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
    if (role)
      form.reset({
        codigo: role.codigo,
        nombre: role.nombre,
        descripcion: role.descripcion || "",
        nivel_jerarquia: role.nivel_jerarquia,
        activo: role.activo,
      });
    else
      form.reset({
        codigo: "",
        nombre: "",
        descripcion: "",
        nivel_jerarquia: 1,
        activo: true,
      });
  }, [role, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="space-y-6 p-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="codigo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ej: ASESOR"
                    {...field}
                    onChange={(e) =>
                      field.onChange(e.target.value.toUpperCase())
                    }
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
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Asesor de Ventas" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="descripcion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Responsabilidades del rol..."
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
            <FormItem className="flex flex-row items-center justify-between rounded-md border p-4 bg-slate-50/50">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Rol Activo</FormLabel>
                <FormDescription>
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

        <div className="flex gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-primary text-primary-foreground"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : role ? (
              "Guardar Cambios"
            ) : (
              "Crear Rol"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
