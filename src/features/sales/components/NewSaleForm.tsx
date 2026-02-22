import { useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import type { VentaPayload, ProductoItem } from "../types";
import { useUbigeo } from "@/features/core/hooks/useUbigeo";

interface Props {
  productos: ProductoItem[];
  grabadores: any[];
  tiposDocumento?: any[];
  initialData?: any;
  onSave: (data: VentaPayload) => Promise<boolean>;
  onClose: () => void;
}

export function NewSaleForm({
  productos,
  grabadores,
  tiposDocumento = [],
  initialData,
  onSave,
  onClose,
}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const extractDate = (dateStr?: string) =>
    dateStr ? dateStr.split("T")[0] : "";

  // Traemos la lógica de Ubigeo
  const {
    departamentos,
    provinciasInst,
    distritosInst,
    provinciasNac,
    distritosNac,
    fetchProvincias,
    fetchDistritos,
  } = useUbigeo();

  const [depInst, setDepInst] = useState("");
  const [provInst, setProvInst] = useState("");
  const [depNac, setDepNac] = useState("");
  const [provNac, setProvNac] = useState("");

  const [formData, setFormData] = useState<VentaPayload>(() => {
    if (initialData) {
      return {
        tecnologia: initialData.tecnologia || "",
        cliente_nombre: initialData.cliente_nombre || "",
        cliente_numero_doc: initialData.cliente_numero_doc || "",
        cliente_telefono: initialData.cliente_telefono || "",
        cliente_email: initialData.cliente_email || "",
        id_producto: initialData.id_producto || 0,
        es_full_claro: initialData.es_full_claro || false,
        direccion_detalle: initialData.direccion_detalle || "",
        coordenadas_gps: initialData.coordenadas_gps || "",
        id_distrito_instalacion: initialData.id_distrito_instalacion || 0,
        id_distrito_nacimiento: initialData.id_distrito_nacimiento || 0,
        id_grabador_audios: 0, // El grabador siempre es nuevo porque es una nueva llamada
        id_tipo_documento: initialData.id_tipo_documento || 1,
        cliente_papa: initialData.cliente_papa || "",
        cliente_mama: initialData.cliente_mama || "",
        numero_instalacion: initialData.numero_instalacion || "",
        cliente_fecha_nacimiento: extractDate(
          initialData.cliente_fecha_nacimiento,
        ),
        plano: initialData.plano || "",
        score_crediticio: initialData.score_crediticio || "",
        referencias: initialData.referencias || "",
        representante_legal_dni: initialData.representante_legal_dni || "",
        representante_legal_nombre:
          initialData.representante_legal_nombre || "",
      };
    }
    // Formulario vacío por defecto
    return {
      tecnologia: "",
      cliente_nombre: "",
      cliente_numero_doc: "",
      cliente_telefono: "",
      cliente_email: "",
      id_producto: 0,
      es_full_claro: false,
      direccion_detalle: "",
      coordenadas_gps: "",
      id_distrito_instalacion: 0,
      id_distrito_nacimiento: 0,
      id_grabador_audios: 0,
      id_tipo_documento: 1,
      cliente_papa: "",
      cliente_mama: "",
      numero_instalacion: "",
      cliente_fecha_nacimiento: "",
      plano: "",
      score_crediticio: "",
      referencias: "",
      representante_legal_dni: "",
      representante_legal_nombre: "",
    };
  });

  // Saber si es RUC para mostrar/ocultar campos (Asumimos ID 3 = RUC según el JSON de Alejandro)
  const isRuc = formData.id_tipo_documento === 3;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.id_producto ||
      !formData.id_grabador_audios ||
      !formData.tecnologia ||
      !formData.id_tipo_documento ||
      !formData.id_distrito_instalacion
    ) {
      alert(
        "Por favor, asegúrese de completar todos los campos obligatorios y selects finales.",
      );
      return;
    }

    setIsSubmitting(true);

    const payloadLimpio: any = {
      ...formData,
      // Aseguramos que viajen aunque estén vacíos para pasar el serializer
      score_crediticio: formData.score_crediticio || "",
      coordenadas_gps: formData.coordenadas_gps || "",
      referencias: formData.referencias || "",
    };

    // Si NO es RUC, borramos los datos del representante para no ensuciar la DB
    if (!isRuc) {
      delete payloadLimpio.representante_legal_dni;
      delete payloadLimpio.representante_legal_nombre;
    }

    // Si no puso distrito de nacimiento, lo borramos (permite nulo)
    if (!payloadLimpio.id_distrito_nacimiento) {
      delete payloadLimpio.id_distrito_nacimiento;
    }

    console.log("PAYLOAD FRONTEND:", payloadLimpio);

    try {
      const success = await onSave(payloadLimpio);
      if (success) onClose();
    } catch (error) {
      console.error("Error al guardar la venta:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ---------------- DATOS DEL CLIENTE ---------------- */}
      <Card className="p-4 space-y-4 bg-slate-50">
        <h3 className="font-semibold text-sm text-slate-700 uppercase tracking-wide">
          Datos del Cliente
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700">
              Tipo Doc.
            </label>
            <Select
              value={formData.id_tipo_documento?.toString()}
              onValueChange={(val) =>
                setFormData({ ...formData, id_tipo_documento: Number(val) })
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Seleccione" />
              </SelectTrigger>
              <SelectContent>
                {/* Mock o Dinámico */}
                <SelectItem value="1">DNI</SelectItem>
                <SelectItem value="2">CE</SelectItem>
                <SelectItem value="3">RUC</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              N° Documento
            </label>
            <Input
              value={formData.cliente_numero_doc}
              onChange={(e) =>
                setFormData({ ...formData, cliente_numero_doc: e.target.value })
              }
              required
              className="mt-1"
            />
          </div>

          <div className={isRuc ? "md:col-span-2" : ""}>
            <label className="text-sm font-medium text-slate-700">
              {isRuc ? "Razón Social" : "Nombre Completo"}
            </label>
            <Input
              value={formData.cliente_nombre}
              onChange={(e) =>
                setFormData({ ...formData, cliente_nombre: e.target.value })
              }
              required
              className="mt-1"
            />
          </div>

          {/* CAMPOS CONDICIONALES PARA RUC */}
          {isRuc && (
            <>
              <div>
                <label className="text-sm font-medium text-slate-700 border-l-2 border-blue-500 pl-2">
                  DNI Rep. Legal
                </label>
                <Input
                  value={formData.representante_legal_dni}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      representante_legal_dni: e.target.value,
                    })
                  }
                  required
                  className="mt-1 border-blue-200"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 border-l-2 border-blue-500 pl-2">
                  Nombre Rep. Legal
                </label>
                <Input
                  value={formData.representante_legal_nombre}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      representante_legal_nombre: e.target.value,
                    })
                  }
                  required
                  className="mt-1 border-blue-200"
                />
              </div>
            </>
          )}

          <div>
            <label className="text-sm font-medium text-slate-700">
              Teléfono
            </label>
            <Input
              value={formData.cliente_telefono}
              onChange={(e) =>
                setFormData({ ...formData, cliente_telefono: e.target.value })
              }
              required
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <Input
              type="email"
              value={formData.cliente_email}
              onChange={(e) =>
                setFormData({ ...formData, cliente_email: e.target.value })
              }
              required
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Nombre del Padre
            </label>
            <Input
              value={formData.cliente_papa}
              onChange={(e) =>
                setFormData({ ...formData, cliente_papa: e.target.value })
              }
              required
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Nombre de la Madre
            </label>
            <Input
              value={formData.cliente_mama}
              onChange={(e) =>
                setFormData({ ...formData, cliente_mama: e.target.value })
              }
              required
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Fecha Nacimiento
            </label>
            <Input
              type="date"
              value={formData.cliente_fecha_nacimiento}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  cliente_fecha_nacimiento: e.target.value,
                })
              }
              required
              className="mt-1"
            />
          </div>
        </div>
      </Card>

      {/* ---------------- UBIGEO DE NACIMIENTO (CASCADA) ---------------- */}
      <Card className="p-4 space-y-4 bg-slate-50 border-l-4 border-l-blue-400">
        <h3 className="font-semibold text-sm text-slate-700 uppercase tracking-wide">
          Lugar de Nacimiento
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-medium text-slate-500">
              Departamento
            </label>
            <Select
              onValueChange={(val) => {
                setDepNac(val);
                fetchProvincias(Number(val), "Nacimiento");
                setFormData({ ...formData, id_distrito_nacimiento: 0 });
              }}
            >
              <SelectTrigger className="mt-1 h-9">
                <SelectValue placeholder="Seleccione" />
              </SelectTrigger>
              <SelectContent>
                {departamentos.map((d) => (
                  <SelectItem key={d.id} value={d.id.toString()}>
                    {d.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">
              Provincia
            </label>
            <Select
              disabled={!depNac}
              onValueChange={(val) => {
                setProvNac(val);
                fetchDistritos(Number(val), "Nacimiento");
              }}
            >
              <SelectTrigger className="mt-1 h-9">
                <SelectValue placeholder="Seleccione" />
              </SelectTrigger>
              <SelectContent>
                {provinciasNac.map((p) => (
                  <SelectItem key={p.id} value={p.id.toString()}>
                    {p.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700 font-bold">
              Distrito (Final)
            </label>
            <Select
              disabled={!provNac}
              onValueChange={(val) =>
                setFormData({
                  ...formData,
                  id_distrito_nacimiento: Number(val),
                })
              }
            >
              <SelectTrigger className="mt-1 h-9 border-blue-300 focus:ring-blue-500">
                <SelectValue placeholder="Requerido" />
              </SelectTrigger>
              <SelectContent>
                {distritosNac.map((d) => (
                  <SelectItem key={d.id} value={d.id.toString()}>
                    {d.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* ---------------- UBIGEO DE INSTALACIÓN Y DIRECCIÓN ---------------- */}
      <Card className="p-4 space-y-4 bg-slate-50 border-l-4 border-l-green-400">
        <h3 className="font-semibold text-sm text-slate-700 uppercase tracking-wide">
          Ubicación de Instalación
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-medium text-slate-500">
              Departamento
            </label>
            <Select
              onValueChange={(val) => {
                setDepInst(val);
                fetchProvincias(Number(val), "Instalacion");
                setFormData({ ...formData, id_distrito_instalacion: 0 });
              }}
            >
              <SelectTrigger className="mt-1 h-9">
                <SelectValue placeholder="Seleccione" />
              </SelectTrigger>
              <SelectContent>
                {departamentos.map((d) => (
                  <SelectItem key={d.id} value={d.id.toString()}>
                    {d.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">
              Provincia
            </label>
            <Select
              disabled={!depInst}
              onValueChange={(val) => {
                setProvInst(val);
                fetchDistritos(Number(val), "Instalacion");
              }}
            >
              <SelectTrigger className="mt-1 h-9">
                <SelectValue placeholder="Seleccione" />
              </SelectTrigger>
              <SelectContent>
                {provinciasInst.map((p) => (
                  <SelectItem key={p.id} value={p.id.toString()}>
                    {p.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700 font-bold">
              Distrito (Final)
            </label>
            <Select
              disabled={!provInst}
              onValueChange={(val) =>
                setFormData({
                  ...formData,
                  id_distrito_instalacion: Number(val),
                })
              }
            >
              <SelectTrigger className="mt-1 h-9 border-green-300 focus:ring-green-500">
                <SelectValue placeholder="Requerido" />
              </SelectTrigger>
              <SelectContent>
                {distritosInst.map((d) => (
                  <SelectItem key={d.id} value={d.id.toString()}>
                    {d.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-700">
              Dirección Detallada
            </label>
            <Input
              value={formData.direccion_detalle}
              onChange={(e) =>
                setFormData({ ...formData, direccion_detalle: e.target.value })
              }
              required
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">
              Referencias
            </label>
            <Input
              value={formData.referencias}
              onChange={(e) =>
                setFormData({ ...formData, referencias: e.target.value })
              }
              className="mt-1"
              placeholder="Ej. Al lado del parque"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">
              Coordenadas GPS
            </label>
            <Input
              value={formData.coordenadas_gps}
              onChange={(e) =>
                setFormData({ ...formData, coordenadas_gps: e.target.value })
              }
              className="mt-1"
              placeholder="-12.0464, -77.0428"
            />
          </div>
          <div className="flex items-center gap-3 mt-4">
            <Switch
              checked={formData.es_full_claro}
              onCheckedChange={(c) =>
                setFormData({ ...formData, es_full_claro: c })
              }
            />
            <label className="text-sm font-medium text-slate-700">
              ¿Es Full Claro?
            </label>
          </div>
        </div>
      </Card>

      {/* ---------------- DATOS DE VENTA ---------------- */}
      <Card className="p-4 space-y-4 bg-slate-50">
        <h3 className="font-semibold text-sm text-slate-700 uppercase tracking-wide">
          Datos de Venta
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700">
              Producto
            </label>
            <Select
              onValueChange={(val) =>
                setFormData({ ...formData, id_producto: Number(val) })
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecciona producto" />
              </SelectTrigger>
              <SelectContent>
                {productos.map((prod) => (
                  <SelectItem key={prod.id} value={prod.id.toString()}>
                    {prod.nombre_plan}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Tecnología
            </label>
            <Select
              onValueChange={(val) =>
                setFormData({ ...formData, tecnologia: val })
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecciona tecnología" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FTTH">FTTH (Fibra Óptica)</SelectItem>
                <SelectItem value="HFC">HFC (Cable)</SelectItem>
                <SelectItem value="WIRELESS">Wireless</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              N° Instalación
            </label>
            <Input
              value={formData.numero_instalacion}
              onChange={(e) =>
                setFormData({ ...formData, numero_instalacion: e.target.value })
              }
              required
              className="mt-1"
              placeholder="Ej. 971100852"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Plano</label>
            <Input
              value={formData.plano}
              onChange={(e) =>
                setFormData({ ...formData, plano: e.target.value })
              }
              required
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Score Crediticio
            </label>
            <Input
              type="text"
              value={formData.score_crediticio}
              onChange={(e) =>
                setFormData({ ...formData, score_crediticio: e.target.value })
              }
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Grabador Audio
            </label>
            <Select
              onValueChange={(val) =>
                setFormData({ ...formData, id_grabador_audios: Number(val) })
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecciona grabador" />
              </SelectTrigger>
              <SelectContent>
                {grabadores.map((grab) => (
                  <SelectItem key={grab.id} value={grab.id.toString()}>
                    {grab.nombre_completo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* ---------------- BOTONES ---------------- */}
      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-blue-600 hover:bg-blue-700"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            "Guardar Venta"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
          className="flex-1"
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
