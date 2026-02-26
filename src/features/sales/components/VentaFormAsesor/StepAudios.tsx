import { useFormContext, useFieldArray, useWatch } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Music, AlertCircle } from "lucide-react";
import { useGrabadores, useTiposDocumento } from "../../hooks/useSales";
import type { CreateVentaFormValues } from "../../schemas/venta.schema";
import { cn } from "@/lib/utils";

interface Props {
  disabled?: boolean;
}

export function StepAudios({ disabled = false }: Props) {
  const form = useFormContext<CreateVentaFormValues>();
  const { data: grabadores = [] } = useGrabadores();
  const { data: tiposDoc = [] } = useTiposDocumento();

  const tipoDocId = useWatch({
    control: form.control,
    name: "id_tipo_documento",
  });
  const tipoDoc = tiposDoc.find((t) => t.id === tipoDocId);
  const esRuc = tipoDoc?.codigo?.toUpperCase() === "RUC";
  const cantidadRequerida = esRuc ? 14 : 12;

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "audios",
  });

  const cantidadActual = fields.length;
  const completo = cantidadActual === cantidadRequerida;

  const agregarAudio = () => {
    if (cantidadActual < cantidadRequerida) {
      append({ nombre_etiqueta: "", url_audio: "" });
    }
  };

  return (
    <div className="space-y-6">
      {/* ── GRABADOR ── */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Grabador de Audio
        </h3>
        <FormField
          control={form.control}
          name="id_grabador_audios"
          render={({ field }) => (
            <FormItem className="max-w-sm">
              <FormLabel>
                Grabador <span className="text-red-500">*</span>
              </FormLabel>
              <Select
                disabled={disabled}
                onValueChange={(v) => field.onChange(Number(v))}
                value={field.value ? String(field.value) : undefined}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el grabador disponible..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {grabadores.map((g) => (
                    <SelectItem key={g.id} value={String(g.id)}>
                      {g.nombre_completo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* ── AUDIOS ── */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Audios de Conformidad
          </h3>
          <div className="flex items-center gap-2">
            <Badge
              variant={completo ? "default" : "secondary"}
              className={cn(
                completo
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-700",
              )}
            >
              {cantidadActual} / {cantidadRequerida} audios
            </Badge>
            {!completo && !disabled && (
              <p className="text-xs text-amber-600">
                {cantidadRequerida - cantidadActual} restante(s)
              </p>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 p-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
          <p className="text-xs text-blue-700">
            {esRuc
              ? "Para ventas con RUC se requieren exactamente 14 audios."
              : "Para ventas con DNI/CE se requieren exactamente 12 audios."}{" "}
            Cada audio necesita una etiqueta descriptiva y la URL de ubicación.
          </p>
        </div>

        {/* Lista de audios */}
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-bold text-zinc-600">
                {index + 1}
              </div>

              <div className="flex-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name={`audios.${index}.nombre_etiqueta`}
                  render={({ field: f }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Etiqueta</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej: Confirmación de servicio..."
                          className="h-8 text-sm"
                          disabled={disabled}
                          {...f}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`audios.${index}.url_audio`}
                  render={({ field: f }) => (
                    <FormItem>
                      <FormLabel className="text-xs">URL del Audio</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://..."
                          className="h-8 text-sm"
                          disabled={disabled}
                          {...f}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {!disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-red-400 hover:bg-red-50 hover:text-red-600"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Botón agregar */}
        {!disabled && cantidadActual < cantidadRequerida && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 w-full border-dashed"
            onClick={agregarAudio}
          >
            <Plus className="mr-2 h-4 w-4" />
            <Music className="mr-1 h-3.5 w-3.5" />
            Agregar Audio ({cantidadActual}/{cantidadRequerida})
          </Button>
        )}

        {/* Error general del array */}
        {form.formState.errors.audios?.root && (
          <p className="mt-2 text-sm text-red-500">
            {form.formState.errors.audios.root.message}
          </p>
        )}
        {form.formState.errors.audios?.message && (
          <p className="mt-2 text-sm text-red-500">
            {form.formState.errors.audios.message as string}
          </p>
        )}
      </div>
    </div>
  );
}
