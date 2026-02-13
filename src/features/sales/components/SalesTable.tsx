import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Edit2, Eye, Trash2 } from "lucide-react";
import { useState } from "react";
import { SalesDetailComplete } from "./SalesDetailComplete";

interface SalesTableProps {
  role?: string;
  onViewDetails?: (sale: any) => void;
  onEdit?: (sale: any) => void;
  onDelete?: (id: number) => void;
}

// Datos de prueba alineados con JARD DIGITAL
const mockSalesData: any[] = [
  {
    id: 1,
    id_asesor: 1,
    cliente_nombre: "Juan Carlos Pérez",
    cliente_numero_doc: "12345678",
    modalidad_venta: "CALL",
    id_producto: 1,
    costo_fijo_plan: 89.9,
    estado_sot: "Pendiente",
    fecha_venta: new Date("2024-02-10"),
    estado_audios_general: "Completo",
  },
  {
    id: 2,
    id_asesor: 1,
    cliente_nombre: "María González",
    cliente_numero_doc: "87654321",
    modalidad_venta: "CALL",
    id_producto: 2,
    costo_fijo_plan: 149.9,
    estado_sot: "Ejecucion",
    fecha_venta: new Date("2024-02-09"),
    estado_audios_general: "Completo",
  },
];

const estadoBadgeColor = (estado: string) => {
  switch (estado) {
    case "Pendiente":
      return "bg-yellow-100 text-yellow-800";
    case "Ejecucion":
      return "bg-blue-100 text-blue-800";
    case "Instalada":
      return "bg-green-100 text-green-800";
    case "Rechazada":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const SalesTable = ({
  role = "advisor",
  onViewDetails,
  onEdit,
  onDelete,
}: SalesTableProps) => {
  const [sales] = useState(mockSalesData);
  const [selectedSale, setSelectedSale] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewDetails = (sale: any) => {
    setSelectedSale(sale);
    setIsModalOpen(true);
    onViewDetails?.(sale);
  };

  // Filtrado básico por rol (si eres asesor solo ves las tuyas)
  const filteredSales =
    role === "advisor" ? sales.filter((s) => s.id_asesor === 1) : sales;

  const handleEditSale = (sale: Venta) => {
    onEdit?.(sale);
  };

  const handleDeleteSale = (id: number) => {
    onDelete?.(id);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-border shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr className="text-slate-600">
                <th className="px-6 py-4 text-left font-semibold">Cliente</th>
                <th className="px-6 py-4 text-left font-semibold">Producto</th>
                <th className="px-6 py-4 text-left font-semibold">Modalidad</th>
                <th className="px-6 py-4 text-left font-semibold">
                  Estado SOT
                </th>
                <th className="px-6 py-4 text-left font-semibold">Fecha</th>
                <th className="px-6 py-4 text-center font-semibold">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredSales.map((sale) => (
                <tr
                  key={sale.id}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-900">
                      {sale.cliente_nombre}
                    </p>
                    <p className="text-xs text-slate-500">
                      {sale.cliente_numero_doc}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-700">ID: {sale.id_producto}</p>
                    <p className="text-xs text-primary font-bold">
                      S/ {sale.costo_fijo_plan}
                    </p>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-600">
                    {sale.modalidad_venta}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        "px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider",
                        estadoBadgeColor(sale.estado_sot),
                      )}
                    >
                      {sale.estado_sot}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {sale.fecha_venta.toLocaleDateString("es-PE")}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleViewDetails(sale)}
                        className="text-sky-600 h-8 w-8"
                      >
                        <Eye size={16} />
                      </Button>
                      {role !== "advisor" && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => onEdit?.(sale)}
                          className="text-amber-600 h-8 w-8"
                        >
                          <Edit2 size={16} />
                        </Button>
                      )}
                      {role === "owner" && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => onDelete?.(sale.id)}
                          className="text-red-600 h-8 w-8"
                        >
                          <Trash2 size={16} />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {selectedSale && (
        <SalesDetailComplete
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedSale(null);
          }}
          sale={selectedSale}
          onEdit={handleEditSale}
          onDelete={handleDeleteSale}
          canEdit={
            role === "backoffice" || role === "supervisor" || role === "owner"
          }
          canDelete={role === "owner"}
        />
      )}
    </div>
  );
};
