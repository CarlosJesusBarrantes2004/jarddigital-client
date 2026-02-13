import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Download, Edit2, Save, X } from "lucide-react";
import { useState } from "react";

function StatusBox({ label, value, badgeClass = "" }: any) {
  return (
    <div className="bg-white border rounded-xl p-4 shadow-sm">
      <p className="text-[10px] font-bold text-slate-400 uppercase">{label}</p>
      <div
        className={cn(
          "mt-2 inline-block px-3 py-1 rounded-full text-xs font-bold",
          badgeClass || "bg-slate-100 text-slate-700",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function DataField({ label, value, isEditing }: any) {
  return (
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase">{label}</p>
      {isEditing ? (
        <Input className="mt-1 h-8 text-xs" defaultValue={value} />
      ) : (
        <p className="text-sm font-medium text-slate-800 mt-1">
          {value || "---"}
        </p>
      )}
    </div>
  );
}

interface SalesDetailCompleteProps {
  isOpen: boolean;
  onClose: () => void;
  sale: any; // Usa tu interfaz Venta aquí
  onEdit?: (sale: any) => void;
  onDelete?: (id: number) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export const SalesDetailComplete = ({
  isOpen,
  onClose,
  sale,
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false,
}: SalesDetailCompleteProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedSale, setEditedSale] = useState(sale);

  if (!isOpen) return null;

  const handleFieldChange = (field: string, value: any) => {
    setEditedSale((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onEdit?.(editedSale);
    setIsEditing(false);
  };

  const handleExport = () => {
    const text = `DETALLES DE VENTA #${sale.id}\nCLIENTE: ${sale.cliente_nombre}\nSOT: ${sale.estado_sot}`;
    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/plain;charset=utf-8," + encodeURIComponent(text),
    );
    element.setAttribute("download", `venta-${sale.id}.txt`);
    element.click();
  };

  const estatoBadgeColor = (estado: string) => {
    const colors: Record<string, string> = {
      Pendiente: "bg-yellow-100 text-yellow-800",
      Ejecucion: "bg-blue-100 text-blue-800",
      Instalada: "bg-green-100 text-green-800",
      Rechazada: "bg-red-100 text-red-800",
    };
    return colors[estado] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border-border">
        {/* Header con gradiente JARD DIGITAL */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 border-b p-6 flex items-center justify-between">
          <div className="text-white">
            <h2 className="text-2xl font-bold">
              Expediente de Venta #{sale.id}
            </h2>
            <p className="text-slate-300 text-sm mt-1">
              {sale.cliente_nombre} • {sale.modalidad_venta} •{" "}
              {new Date(sale.fecha_venta).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              variant="ghost"
              onClick={handleExport}
              className="text-white hover:bg-white/10"
            >
              <Download size={18} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={onClose}
              className="text-white hover:bg-white/10"
            >
              <X size={20} />
            </Button>
          </div>
        </div>

        {/* Cuerpo con Scroll */}
        <div className="p-6 space-y-8 overflow-y-auto bg-slate-50/50">
          {/* Status Quick View */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatusBox
              label="Estado SOT"
              value={sale.estado_sot}
              badgeClass={estatoBadgeColor(sale.estado_sot)}
            />
            <StatusBox
              label="Audios"
              value={sale.estado_audios_general}
              badgeClass={
                sale.estado_audios_general === "Completo"
                  ? "bg-green-100 text-green-800"
                  : "bg-amber-100 text-amber-800"
              }
            />
            <StatusBox label="Score" value={sale.score_crediticio} />
          </div>

          {/* Grid de Información */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Columna Cliente */}
            <section className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b pb-1">
                Información del Cliente
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <DataField
                  label="DNI/RUC"
                  value={sale.cliente_numero_doc}
                  isEditing={isEditing}
                />
                <DataField
                  label="Teléfono"
                  value={sale.cliente_telefono}
                  isEditing={isEditing}
                />
                <div className="col-span-2">
                  <DataField
                    label="Email"
                    value={sale.cliente_email}
                    isEditing={isEditing}
                  />
                </div>
              </div>
            </section>

            {/* Columna Ubicación */}
            <section className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b pb-1">
                Ubicación de Instalación
              </h3>
              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-700">
                  {sale.direccion_detalle}
                </p>
                <p className="text-xs text-slate-500">
                  {sale.direccion_distrito}, {sale.direccion_provincia}
                </p>
                <div className="bg-sky-50 p-2 rounded border border-sky-100">
                  <p className="text-[10px] font-bold text-sky-700 uppercase">
                    Referencia
                  </p>
                  <p className="text-xs text-sky-800">
                    {sale.direccion_referencia}
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Footer de Acciones */}
        <div className="p-4 bg-white border-t flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>

          {isEditing ? (
            <Button
              onClick={handleSave}
              className="bg-sky-600 hover:bg-sky-700 text-white"
            >
              <Save size={16} className="mr-2" /> Guardar Cambios
            </Button>
          ) : (
            canEdit && (
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-slate-800 hover:bg-slate-900 text-white"
              >
                <Edit2 size={16} className="mr-2" /> Editar Expediente
              </Button>
            )
          )}
        </div>
      </Card>
    </div>
  );
};
