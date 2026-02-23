import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

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
    if (modality)
      form.reset({
        nombre: modality.nombre,
        activo: modality.activo,
      });
    else form.reset({ nombre: "", activo: true });
  }, [modality, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="space-y-6 p-6">
        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de la Modalidad</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: CALL CENTER"
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
            <FormItem className="flex flex-row items-center justify-between rounded-md border p-4 bg-slate-50/50">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Modalidad Activa</FormLabel>
                <FormDescription>
                  Permite o bloquea el acceso mediante esta modalidad.
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
            ) : modality ? (
              "Guardar Cambios"
            ) : (
              "Crear Modalidad"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
