// features/sales/components/SalesTable.tsx
import { Edit2, Eye, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Venta } from "../types";

export function EstadoBadge({ estado }: { estado: string }) {
  const colors: Record<string, string> = {
    CONFORME: "bg-green-100 text-green-800 border-green-200",
    ATENDIDO: "bg-green-100 text-green-800 border-green-200",
    PENDIENTE: "bg-yellow-100 text-yellow-800 border-yellow-200",
    EJECUCION: "bg-blue-100 text-blue-800 border-blue-200",
    RECHAZADO: "bg-red-100 text-red-800 border-red-200",
    OBSERVADO: "bg-orange-100 text-orange-800 border-orange-200",
  };
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs font-medium",
        colors[estado] || "bg-slate-100 text-slate-800",
      )}
    >
      {estado}
    </Badge>
  );
}

interface SalesTableProps {
  ventas: Venta[];
  userRole: string;
  onAction: (venta: Venta, action: "ver" | "gestion" | "clonar") => void;
}

export function SalesTable({ ventas, userRole, onAction }: SalesTableProps) {
  const canManage = ["BACKOFFICE", "DUENO", "SUPERVISOR"].includes(userRole);

  console.log(ventas);

  return (
    <Card className="overflow-hidden bg-white border-slate-200">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-100 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">
                Producto
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">
                Fecha
              </th>
              {canManage && (
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">
                  Asesor
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">
                Estado SOT
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">
                Estado Audio
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-slate-700 uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {ventas.map((venta) => (
              <tr
                key={venta.id}
                className="hover:bg-slate-50 transition-colors"
              >
                <td className="px-6 py-4">
                  <p className="font-medium text-slate-900">
                    {venta.cliente_nombre}
                  </p>
                  <p className="text-xs text-slate-500">
                    DNI: {venta.cliente_numero_doc}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-slate-900">
                    {venta.nombre_producto || "Producto Base"}
                  </p>
                  <p className="text-xs text-slate-500">{venta.tecnologia}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-slate-900">
                    {venta.fecha_venta
                      ? new Date(venta.fecha_venta).toLocaleDateString()
                      : "En proceso"}
                  </p>
                </td>
                {canManage && (
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-900">
                      {venta.nombre_asesor || "Asesor"}
                    </p>
                  </td>
                )}
                <td className="px-6 py-4">
                  <EstadoBadge estado={venta.nombre_estado || "PENDIENTE"} />
                </td>
                <td className="px-6 py-4">
                  <EstadoBadge
                    estado={venta.audio_subido ? "CONFORME" : "PENDIENTE"}
                  />
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    {/* MAGIA: Si está rechazado, mostramos botón de reingreso */}
                    {venta.nombre_estado === "Rechazado" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onAction(venta, "clonar")}
                        className="text-orange-600 border-orange-200 hover:bg-orange-50 gap-2"
                        title="Reingresar esta venta como una nueva"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span className="hidden sm:inline text-xs font-semibold">
                          Reingresar
                        </span>
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          onAction(venta, canManage ? "gestion" : "ver")
                        }
                        className="text-blue-600 hover:bg-blue-50"
                      >
                        {canManage ? (
                          <Edit2 className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
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
  );
}
