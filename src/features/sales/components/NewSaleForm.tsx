import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useUbigeo } from "@/features/core/hooks/useUbigeos";
import { zodResolver } from "@hookform/resolvers/zod";

import { newSaleFormSchema, type NewSaleFormData } from "../schemas/saleSchema";

import type { ProductItem, SalePayload } from "../types";

interface NewSaleFormProps {
  products: ProductItem[];
  engravers: any[];
  initialData?: any;
  onSave: (data: SalePayload) => Promise<boolean>;
  onClose: () => void;
}

export function NewSaleForm({
  products = [],
  engravers = [],
  initialData,
  onSave,
  onClose,
}: NewSaleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [depInst, setDepInst] = useState("");
  const [provInst, setProvInst] = useState("");
  const [depBirth, setDepBirth] = useState("");
  const [provBirth, setProvBirth] = useState("");

  const {
    departments = [],
    provincesInst = [],
    districtsInst = [],
    provincesBirth = [],
    districtsBirth = [],
    fetchProvinces,
    fetchDistricts,
  } = useUbigeo();

  const extractDate = (dateStr?: string) =>
    dateStr ? dateStr.split("T")[0] : "";

  const form = useForm<NewSaleFormData>({
    resolver: zodResolver(newSaleFormSchema),
    defaultValues: {
      id_tipo_documento: "1", // DNI por defecto
      cliente_numero_doc: "",
      cliente_nombre: "",
      representante_legal_dni: "",
      representante_legal_nombre: "",
      cliente_telefono: "",
      cliente_email: "",
      cliente_papa: "",
      cliente_mama: "",
      cliente_fecha_nacimiento: "",
      id_distrito_nacimiento: "",
      id_distrito_instalacion: "",
      direccion_detalle: "",
      referencias: "",
      coordenadas_gps: "",
      es_full_claro: false,
      id_producto: "",
      tecnologia: "",
      numero_instalacion: "",
      plano: "",
      score_crediticio: "",
      id_grabador_audios: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        id_tipo_documento: initialData.id_tipo_documento?.toString() || "1",
        cliente_numero_doc: initialData.cliente_numero_doc || "",
        cliente_nombre: initialData.cliente_nombre || "",
        representante_legal_dni: initialData.representante_legal_dni || "",
        representante_legal_nombre:
          initialData.representante_legal_nombre || "",
        cliente_telefono: initialData.cliente_telefono || "",
        cliente_email: initialData.cliente_email || "",
        cliente_papa: initialData.cliente_papa || "",
        cliente_mama: initialData.cliente_mama || "",
        cliente_fecha_nacimiento: extractDate(
          initialData.cliente_fecha_nacimiento,
        ),
        id_distrito_nacimiento:
          initialData.id_distrito_nacimiento?.toString() || "",
        id_distrito_instalacion:
          initialData.id_distrito_instalacion?.toString() || "",
        direccion_detalle: initialData.direccion_detalle || "",
        referencias: initialData.referencias || "",
        coordenadas_gps: initialData.coordenadas_gps || "",
        es_full_claro: initialData.es_full_claro || false,
        id_producto: initialData.id_producto?.toString() || "",
        tecnologia: initialData.tecnologia || "",
        numero_instalacion: initialData.numero_instalacion || "",
        plano: initialData.plano || "",
        score_crediticio: initialData.score_crediticio || "",
        id_grabador_audios: "", // Reset obligatorio del audio al clonar
      });
    }
  }, [initialData, form]);

  const currentDocType = form.watch("id_tipo_documento");
  const isRuc = currentDocType === "3";

  const onSubmit = async (data: NewSaleFormData) => {
    setIsSubmitting(true);

    const payload: any = {
      ...data,
      id_tipo_documento: Number(data.id_tipo_documento),
      id_distrito_instalacion: Number(data.id_distrito_instalacion),
      id_producto: Number(data.id_producto),
      id_grabador_audios: Number(data.id_grabador_audios),
    };

    if (data.id_distrito_nacimiento) {
      payload.id_distrito_nacimiento = Number(data.id_distrito_nacimiento);
    } else {
      delete payload.id_distrito_nacimiento; // Para que viaje Null a la BD si es vacío
    }

    if (!isRuc) {
      delete payload.representante_legal_dni;
      delete payload.representante_legal_nombre;
    }
    if (!payload.score_crediticio) delete payload.score_crediticio;
    if (!payload.referencias) delete payload.referencias;

    try {
      const success = await onSave(payload as SalePayload);
      if (success) onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 animate-in fade-in duration-300 pb-24"
      >
        {/* ================= DATOS DEL CLIENTE ================= */}
        <Card className="p-5 space-y-4 bg-white border-slate-200 shadow-sm">
          <h3 className="font-bold text-xs text-primary uppercase tracking-wider border-b pb-2">
            Identificación del Cliente
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="id_tipo_documento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo Doc.</FormLabel>
                  {/* VINCULACIÓN DIRECTA (Sin conversiones) */}
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">DNI</SelectItem>
                      <SelectItem value="2">CE</SelectItem>
                      <SelectItem value="3">RUC</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cliente_numero_doc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>N° Documento</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: 7289..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cliente_nombre"
              render={({ field }) => (
                <FormItem className={isRuc ? "md:col-span-2" : ""}>
                  <FormLabel>
                    {isRuc ? "Razón Social" : "Nombre Completo"}
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre del titular..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isRuc && (
              <>
                <FormField
                  control={form.control}
                  name="representante_legal_dni"
                  render={({ field }) => (
                    <FormItem className="animate-in fade-in zoom-in-95 duration-200">
                      <FormLabel className="text-blue-600">
                        DNI Rep. Legal
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="border-blue-200"
                          placeholder="Obligatorio"
                          {...field}
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
                    <FormItem className="animate-in fade-in zoom-in-95 duration-200">
                      <FormLabel className="text-blue-600">
                        Nombre Rep. Legal
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="border-blue-200"
                          placeholder="Obligatorio"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <FormField
              control={form.control}
              name="cliente_telefono"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <Input placeholder="999..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cliente_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo Electrónico</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cliente_papa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Padre</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cliente_mama"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la Madre</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cliente_fecha_nacimiento"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Fecha de Nacimiento</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Card>

        {/* ================= UBIGEO NACIMIENTO ================= */}
        <Card className="p-5 space-y-4 bg-blue-50/30 border-l-4 border-l-blue-400 shadow-sm">
          <h3 className="font-bold text-xs text-blue-700 uppercase tracking-wider border-b border-blue-200 pb-2">
            Lugar de Nacimiento (Opcional)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormItem>
              <FormLabel className="text-slate-600">Departamento</FormLabel>
              <Select
                onValueChange={(val) => {
                  setDepBirth(val);
                  fetchProvinces(Number(val), "Nacimiento");
                  form.setValue("id_distrito_nacimiento", "");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione" />
                </SelectTrigger>
                <SelectContent>
                  {departments?.map((d) => (
                    <SelectItem key={d.id} value={d.id.toString()}>
                      {d.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>

            <FormItem>
              <FormLabel className="text-slate-600">Provincia</FormLabel>
              <Select
                disabled={!depBirth}
                onValueChange={(val) => {
                  setProvBirth(val);
                  fetchDistricts(Number(val), "Nacimiento");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione" />
                </SelectTrigger>
                <SelectContent>
                  {provincesBirth?.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>

            <FormField
              control={form.control}
              name="id_distrito_nacimiento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold text-blue-700">
                    Distrito
                  </FormLabel>
                  <Select
                    disabled={!provBirth}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="border-blue-200 focus:ring-blue-400">
                        <SelectValue placeholder="Seleccione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {districtsBirth?.map((d) => (
                        <SelectItem key={d.id} value={d.id.toString()}>
                          {d.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Card>

        {/* ================= UBIGEO INSTALACIÓN ================= */}
        <Card className="p-5 space-y-4 bg-green-50/30 border-l-4 border-l-green-500 shadow-sm">
          <h3 className="font-bold text-xs text-green-700 uppercase tracking-wider border-b border-green-200 pb-2">
            Lugar de Instalación
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormItem>
              <FormLabel>Departamento</FormLabel>
              <Select
                onValueChange={(val) => {
                  setDepInst(val);
                  fetchProvinces(Number(val), "Instalacion");
                  form.setValue("id_distrito_instalacion", "");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione" />
                </SelectTrigger>
                <SelectContent>
                  {departments?.map((d) => (
                    <SelectItem key={d.id} value={d.id.toString()}>
                      {d.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>

            <FormItem>
              <FormLabel>Provincia</FormLabel>
              <Select
                disabled={!depInst}
                onValueChange={(val) => {
                  setProvInst(val);
                  fetchDistricts(Number(val), "Instalacion");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione" />
                </SelectTrigger>
                <SelectContent>
                  {provincesInst?.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>

            <FormField
              control={form.control}
              name="id_distrito_instalacion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold text-green-700">
                    Distrito (Final)
                  </FormLabel>
                  <Select
                    disabled={!provInst}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="border-green-300 focus:ring-green-500">
                        <SelectValue placeholder="Requerido" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {districtsInst?.map((d) => (
                        <SelectItem key={d.id} value={d.id.toString()}>
                          {d.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <FormField
              control={form.control}
              name="direccion_detalle"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Dirección Detallada</FormLabel>
                  <FormControl>
                    <Input placeholder="Av. Principal..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="referencias"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referencias</FormLabel>
                  <FormControl>
                    <Input placeholder="Cerca del parque..." {...field} />
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
                  <FormLabel>Coordenadas GPS</FormLabel>
                  <FormControl>
                    <Input placeholder="-12.0464, -77.0428" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Card>

        {/* ================= DATOS DE VENTA ================= */}
        <Card className="p-5 space-y-4 bg-white border-slate-200 shadow-sm">
          <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider border-b pb-2">
            Datos Operativos
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="id_producto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Producto / Plan</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {products?.map((p) => (
                        <SelectItem key={p.id} value={p.id.toString()}>
                          {p.nombre_plan}
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
                  <FormLabel>Tecnología</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="FTTH">FTTH (Fibra Óptica)</SelectItem>
                      <SelectItem value="HFC">HFC (Cable)</SelectItem>
                      <SelectItem value="WIRELESS">Wireless</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="numero_instalacion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>N° de Instalación</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. 971..." {...field} />
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
                  <FormLabel>Plano Asignado</FormLabel>
                  <FormControl>
                    <Input placeholder="Código..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="score_crediticio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Score Crediticio</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Verde" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="id_grabador_audios"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold text-slate-800">
                    Grabador Responsable
                  </FormLabel>
                  {/* VINCULACIÓN DIRECTA Y LIMPIA */}
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="border-slate-300">
                        <SelectValue placeholder="Seleccione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {engravers?.map((g) => (
                        <SelectItem key={g.id} value={g.id.toString()}>
                          {g.nombre_completo}
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
              name="es_full_claro"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 md:col-span-2 bg-slate-50">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base font-bold">
                      Cliente Full Claro
                    </FormLabel>
                    <FormDescription>
                      Activa esta opción si el cliente aplica a beneficios Full
                      Claro.
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
        </Card>

        {/* ================= CONTROLES ================= */}
        <div className="flex gap-3 p-4 bg-white/80 backdrop-blur-md border-t absolute bottom-0 left-0 right-0 z-50">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-primary font-bold shadow-md"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              "Procesar Venta"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
