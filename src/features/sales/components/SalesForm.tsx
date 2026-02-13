import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Save } from "lucide-react";
import { cn } from "@/lib/utils";

// Tipos locales (hasta que los muevas a src/types)
interface Producto {
  id: number;
  nombre_plan: string;
  es_alto_valor: boolean;
  comision_base: number;
  activo: boolean;
}

// Mock products para JARD DIGITAL
const mockProductos: Producto[] = [
  {
    id: 1,
    nombre_plan: "100MB Fibra",
    es_alto_valor: true,
    comision_base: 150,
    activo: true,
  },
  {
    id: 2,
    nombre_plan: "300MB Fibra",
    es_alto_valor: true,
    comision_base: 200,
    activo: true,
  },
  {
    id: 3,
    nombre_plan: "50MB HFC",
    es_alto_valor: false,
    comision_base: 100,
    activo: true,
  },
];
export const SalesForm = () => {
  const [activeTab, setActiveTab] = useState("cliente");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<any>({
    cliente_tipo_doc: "DNI",
    cliente_numero_doc: "",
    cliente_nombre: "",
    tecnologia: "FTTH",
    estado_sot: "Pendiente",
  });

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value, type } = e.target;
    const finalValue =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : value;

    setFormData((prev: any) => ({ ...prev, [name]: finalValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulación de API a Django
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    alert("Venta registrada exitosamente en JARD DIGITAL");
  };

  const tabs = [
    { id: "cliente", label: "Cliente", icon: "👤" },
    { id: "producto", label: "Producto", icon: "📦" },
    { id: "ubicacion", label: "Ubicación", icon: "📍" },
    { id: "operativos", label: "Operativos", icon: "⚙️" },
    { id: "audios", label: "Audios", icon: "🔊" },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs de Navegación */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-all",
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground hover:bg-muted",
            )}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECCIÓN CLIENTE */}
        {activeTab === "cliente" && (
          <Card className="p-6 space-y-6 animate-in fade-in duration-300">
            <h3 className="text-lg font-semibold text-primary">
              Información del Cliente
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Tipo de Documento
                </label>
                <select
                  name="cliente_tipo_doc"
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                  onChange={handleInputChange}
                >
                  <option>DNI</option>
                  <option>RUC</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Número de Documento
                </label>
                <Input
                  name="cliente_numero_doc"
                  placeholder="Ej: 72635412"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Nombre Completo
                </label>
                <Input
                  name="cliente_nombre"
                  placeholder="Nombre completo del cliente"
                  required
                />
              </div>
            </div>
          </Card>
        )}

        {/* SECCIÓN PRODUCTO */}
        {activeTab === "producto" && (
          <Card className="p-6 space-y-6 animate-in fade-in duration-300">
            <h3 className="text-lg font-semibold text-primary">
              Detalles del Plan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Seleccionar Plan
                </label>
                <select
                  name="id_producto"
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                  required
                >
                  <option value="">Seleccione un plan comercial...</option>
                  {mockProductos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre_plan} - S/{p.comision_base}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Tecnología
                </label>
                <select
                  name="tecnologia"
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                >
                  <option>FTTH (Fibra)</option>
                  <option>HFC</option>
                </select>
              </div>
            </div>
          </Card>
        )}

        {/* BOTONES DE ACCIÓN */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            type="submit"
            className="flex-1 h-12 bg-primary hover:bg-primary/90"
            disabled={isSubmitting}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting ? "Procesando..." : "Guardar Registro de Venta"}
          </Button>
          <Button variant="outline" type="button" className="h-12">
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
};
