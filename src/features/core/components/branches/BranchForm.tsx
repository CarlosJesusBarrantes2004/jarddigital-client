import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import type { Branch, BranchModality, BranchPayload } from "../../types";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

interface BranchFormProps {
  branch: Branch | null;
  modalities: BranchModality[];
  onSave: (data: BranchPayload) => Promise<void>;
  onCancel: () => void;
}

const branchFormSchema = z.object({
  nombre: z.string().min(2, { message: "El nombre es obligatorio" }),
  direccion: z.string().min(5, { message: "La dirección es obligatoria" }),
  activo: z.boolean().default(true),
  ids_modalidades: z
    .array(z.number())
    .min(1, { message: "Debes seleccionar al menos una modalidad" }),
});

type BranchFormData = z.infer<typeof branchFormSchema>;

export const BranchForm = ({
  branch,
  modalities,
  onSave,
  onCancel,
}: BranchFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (branch)
      form.reset({
        nombre: branch.nombre,
        direccion: branch.direccion,
        activo: branch.activo,
        ids_modalidades: branch.modalidades.map((m) => m.id) || [],
      });
    else
      form.reset({
        nombre: "",
        direccion: "",
        activo: true,
        ids_modalidades: [],
      });
  }, [branch, form]);

  const onSubmit = async (data: BranchFormData) => {
    setIsSubmitting(true);
    await onSave(data);
    setIsSubmitting(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Jard Digital - Lima" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="direccion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección</FormLabel>
              <FormControl>
                <Input placeholder="Dirección completa" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ids_modalidades"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Modalidades</FormLabel>
              <div className="space-y-2">
                {modalities.map((option) => (
                  <label
                    key={option.id}
                    className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-muted"
                  >
                    <input
                      type="checkbox"
                      checked={field.value.includes(option.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          field.onChange([...field.value, option.id]);
                        } else {
                          field.onChange(
                            field.value.filter((v) => v !== option.id),
                          );
                        }
                      }}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <span className="text-sm">{option.nombre}</span>
                  </label>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="activo"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="w-4 h-4"
                />
              </FormControl>
              <FormLabel className="font-normal">Sucursal Activa</FormLabel>
            </FormItem>
          )}
        />

        <div className="flex gap-2">
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : branch ? (
              "Guardar Cambios"
            ) : (
              "Crear Sucursal"
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
};
