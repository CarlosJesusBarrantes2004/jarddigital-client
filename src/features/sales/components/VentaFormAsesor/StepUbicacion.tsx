import { useFormContext } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { UbigeoCascada } from "../UbigeoCascada";
import type { CreateVentaFormValues } from "../../schemas/venta.schema";

interface Props {
  disabled?: boolean;
}

export function StepUbicacion({ disabled = false }: Props) {
  const form = useFormContext<CreateVentaFormValues>();

  return (
    <div className="space-y-6">
      {/* ── UBIGEO INSTALACIÓN ── */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Dirección de Instalación
        </h3>
        <UbigeoCascada
          depFieldName="dep_instalacion_id"
          provFieldName="prov_instalacion_id"
          distFieldName="id_distrito_instalacion"
          labels={{
            dep: "Departamento",
            prov: "Provincia",
            dist: "Distrito",
          }}
          disabled={disabled}
          required
        />
      </div>

      {/* ── DETALLES ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="direccion_detalle"
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>
                Dirección Detallada <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Jr. Los Pinos 123, Urb. La Victoria..."
                  disabled={disabled}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="referencias"
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>Referencias</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Al frente del parque, casa azul con rejas negras..."
                  rows={2}
                  disabled={disabled}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="plano"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Plano <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Código de plano..."
                  disabled={disabled}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="coordenadas_gps"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Coordenadas GPS <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="-12.0464, -77.0428"
                  disabled={disabled}
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-xs">
                Lat, Long — puedes obtenerlas desde Google Maps
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="score_crediticio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Score Crediticio <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="A, B, C..."
                  disabled={disabled}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Full Claro toggle */}
        <FormField
          control={form.control}
          name="es_full_claro"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border border-zinc-200 p-3">
              <div>
                <Label htmlFor="es_full_claro" className="font-medium">
                  ¿Es Full Claro?
                </Label>
                <p className="text-xs text-zinc-500">
                  Marcar si el cliente tiene todos los servicios Claro
                </p>
              </div>
              <FormControl>
                <Switch
                  id="es_full_claro"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={disabled}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
