import { Card } from "@/components/ui/card";
import type { Venta } from "../types";
import { Badge } from "@/components/ui/badge";

interface SaleDetailViewerProps {
  venta: Venta;
}

export const SaleDetailViewer = ({ venta }: SaleDetailViewerProps) => {
  return (
    <div className="space-y-6">
      <Card className="p-4 space-y-3 bg-slate-50 border-slate-200">
        <h3 className="font-semibold text-sm text-slate-700 uppercase tracking-wide border-b pb-2">
          Información del Cliente
        </h3>
        <div className="grid grid-cols-2 gap-y-4 text-sm">
          <div>
            <p className="text-slate-500 text-xs">Nombre Completo</p>
            <p className="font-medium text-slate-900">{venta.cliente_nombre}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs">Documento</p>
            <p className="font-medium text-slate-900">
              {venta.cliente_numero_doc}
            </p>
          </div>
          <div>
            <p className="text-slate-500 text-xs">Teléfono</p>
            <p className="font-medium text-slate-900">
              {venta.cliente_telefono}
            </p>
          </div>
          <div>
            <p className="text-slate-500 text-xs">Email</p>
            <p className="font-medium text-slate-900">{venta.cliente_email}</p>
          </div>
        </div>
      </Card>

      <Card className="p-4 space-y-3 bg-blue-50 border-blue-100">
        <h3 className="font-semibold text-sm text-blue-800 uppercase tracking-wide border-b border-blue-200 pb-2">
          Datos Operativos (Backoffice)
        </h3>
        <div className="grid grid-cols-2 gap-y-4 text-sm">
          <div>
            <p className="text-blue-600/80 text-xs">Código SEC</p>
            <p className="font-medium text-blue-950">
              {venta.codigo_sec || (
                <span className="text-slate-400 italic">
                  Pendiente de gestión
                </span>
              )}
            </p>
          </div>
          <div>
            <p className="text-blue-600/80 text-xs">Código SOT</p>
            <p className="font-medium text-blue-950">
              {venta.codigo_sot || (
                <span className="text-slate-400 italic">
                  Pendiente de gestión
                </span>
              )}
            </p>
          </div>
          <div>
            <p className="text-blue-600/80 text-xs">Fecha Visita SOT</p>
            <p className="font-medium text-blue-950">
              {venta.fecha_visita_programada || "No asignada"}
            </p>
          </div>
          <div>
            <p className="text-blue-600/80 text-xs">Estado Actual</p>
            <Badge variant="outline" className="mt-1 bg-white">
              {venta.nombre_estado || "PENDIENTE"}
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  );
};
