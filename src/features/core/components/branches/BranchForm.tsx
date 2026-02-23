import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
    if (branch)
      form.reset({
        nombre: branch.nombre,
        direccion: branch.direccion,
        activo: branch.activo,
        ids_modalidades: branch.modalidades.map((m) => m.id),
      });
    else
      form.reset({
        nombre: "",
        direccion: "",
        activo: true,
        ids_modalidades: [],
      });
  }, [branch, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="space-y-6 p-6">
        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de la Sucursal</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Jard Digital - Centro" {...field} />
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
              <FormLabel>Dirección Física</FormLabel>
              <FormControl>
                <Input placeholder="Av. Principal 123, Chiclayo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ids_modalidades"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">
                  Modalidades Operativas
                </FormLabel>
                <FormDescription>
                  Seleccione los tipos de operaciones permitidas en esta sede.
                </FormDescription>
              </div>
              <div className="grid grid-cols-1 gap-3 border rounded-lg p-4 bg-slate-50/50">
                {modalities.map((item) => (
                  <FormField
                    key={item.id}
                    control={form.control}
                    name="ids_modalidades"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={item.id}
                          className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(item.id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, item.id])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== item.id,
                                      ),
                                    );
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer flex-1 text-sm">
                            {item.nombre}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
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
            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 bg-slate-50/50">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Sucursal Activa</FormLabel>
                <FormDescription>
                  Determina si los asesores pueden operar en esta sede.
                </FormDescription>
              </div>
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
            ) : branch ? (
              "Guardar Cambios"
            ) : (
              "Crear Sucursal"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};
