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
import type { Modality } from "../../types";

const modalidadSchema = z.object({
  nombre: z.string().min(2, "El nombre es obligatorio"),
  activo: z.boolean().default(true),
});

type ModalityFormData = z.infer<typeof modalidadSchema>;

interface ModalityFormProps {
  modality: Modality | null;
  onSave: (data: { nombre: string; activo: boolean }) => Promise<void>;
  onCancel: () => void;
}

export function ModalityForm({
  modality,
  onSave,
  onCancel,
}: ModalityFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ModalityFormData>({
    resolver: zodResolver(modalidadSchema),
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

  const onSubmit = async (data: ModalityFormData) => {
    setIsSubmitting(true);
    await onSave(data);
    setIsSubmitting(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                {/* Lo pasamos a mayúsculas automáticamente como es costumbre */}
                <Input
                  placeholder="Ej: CENTRO DE LLAMADAS"
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
