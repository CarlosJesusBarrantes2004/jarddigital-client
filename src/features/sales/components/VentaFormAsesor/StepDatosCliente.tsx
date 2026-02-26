import { useFormContext, useWatch } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { UbigeoCascada } from "../UbigeoCascada";
import { useTiposDocumento, useProductos } from "../../hooks/useSales";
import type { CreateVentaFormValues } from "../../schemas/venta.schema";

const TECNOLOGIAS = ["FTTH", "HFC", "ADSL", "LTE"] as const;

interface Props {
  disabled?: boolean;
}

export function StepDatosCliente({ disabled = false }: Props) {
  const form = useFormContext<CreateVentaFormValues>();
  const { data: tiposDoc = [] } = useTiposDocumento();
  const { data: productos = [] } = useProductos();

  const tipoDocId = useWatch({
    control: form.control,
    name: "id_tipo_documento",
  });
  const tipoDocSeleccionado = tiposDoc.find((t) => t.id === tipoDocId);
  const esRuc = tipoDocSeleccionado?.codigo?.toUpperCase() === "RUC";

  // Sincronizamos el campo auxiliar para la validación en el schema
  const handleTipoDocChange = (value: string) => {
    const id = Number(value);
    const td = tiposDoc.find((t) => t.id === id);
    form.setValue("id_tipo_documento", id);
    form.setValue("_codigo_tipo_doc", td?.codigo ?? "");
  };

  return (
    <div className="space-y-6">
      {/* ── PRODUCTO ── */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Producto
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="id_producto"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Plan <span className="text-red-500">*</span>
                </FormLabel>
                <Select
                  disabled={disabled}
                  onValueChange={(v) => field.onChange(Number(v))}
                  value={field.value ? String(field.value) : undefined}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el plan..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {productos.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.nombre_plan}
                        {p.es_alto_valor && (
                          <span className="ml-2 text-xs text-amber-600">
                            ⭐ Alto valor
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tecnologia"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Tecnología <span className="text-red-500">*</span>
                </FormLabel>
                <Select
                  disabled={disabled}
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="FTTH, HFC..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TECNOLOGIAS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <Separator />

      {/* ── DATOS DEL CLIENTE ── */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Datos del Cliente
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Tipo documento */}
          <FormField
            control={form.control}
            name="id_tipo_documento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Tipo Documento <span className="text-red-500">*</span>
                </FormLabel>
                <Select
                  disabled={disabled}
                  onValueChange={handleTipoDocChange}
                  value={field.value ? String(field.value) : undefined}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="DNI, RUC..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {tiposDoc.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Número documento */}
          <FormField
            control={form.control}
            name="cliente_numero_doc"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  N° Documento <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={esRuc ? "20XXXXXXXXX" : "XXXXXXXX"}
                    disabled={disabled}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Nombre */}
          <FormField
            control={form.control}
            name="cliente_nombre"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>
                  Nombre / Razón Social <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Nombre completo del cliente..."
                    disabled={disabled}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Apellido paterno */}
          <FormField
            control={form.control}
            name="cliente_papa"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Apellido Paterno <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="García..."
                    disabled={disabled}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Apellido materno */}
          <FormField
            control={form.control}
            name="cliente_mama"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Apellido Materno <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="López..."
                    disabled={disabled}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Teléfono */}
          <FormField
            control={form.control}
            name="cliente_telefono"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Teléfono <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="9XXXXXXXX"
                    disabled={disabled}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Email */}
          <FormField
            control={form.control}
            name="cliente_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Email <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="cliente@email.com"
                    disabled={disabled}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Fecha de nacimiento */}
          <FormField
            control={form.control}
            name="cliente_fecha_nacimiento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Fecha de Nacimiento <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input type="date" disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Número instalación */}
          <FormField
            control={form.control}
            name="numero_instalacion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  N° Instalación <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Número de cuenta/instalación..."
                    disabled={disabled}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Ubigeo nacimiento */}
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-zinc-700">
            Lugar de Nacimiento
          </p>
          <UbigeoCascada
            depFieldName="dep_nacimiento_id"
            provFieldName="prov_nacimiento_id"
            distFieldName="id_distrito_nacimiento"
            labels={{
              dep: "Departamento (nacimiento)",
              prov: "Provincia (nacimiento)",
              dist: "Distrito (nacimiento)",
            }}
            disabled={disabled}
          />
        </div>
      </div>

      {/* ── REPRESENTANTE LEGAL (solo RUC) ── */}
      {esRuc && (
        <>
          <Separator />
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-amber-600">
              Representante Legal
            </h3>
            <p className="mb-3 text-xs text-zinc-500">
              Obligatorio para RUC: ingresa los datos del titular de la empresa.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="representante_legal_dni"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      DNI del Representante{" "}
                      <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="DNI del titular..."
                        disabled={disabled}
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="representante_legal_nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Nombre del Representante{" "}
                      <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nombre completo del representante..."
                        disabled={disabled}
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
