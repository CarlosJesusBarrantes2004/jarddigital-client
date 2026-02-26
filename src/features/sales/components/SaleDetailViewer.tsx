import {
  Box,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
  UserCheck,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import type { Sale } from "../types/sales.types";

interface SaleDetailViewerProps {
  sale: Sale;
}

export const SaleDetailViewer = ({ sale }: SaleDetailViewerProps) => {
  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <div className="bg-slate-100/50 border-b p-3 flex items-center gap-2">
          <User className="w-4 h-4 text-slate-500" />
          <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider">
            Ficha del Cliente
          </h3>
        </div>
        <div className="p-4 grid grid-cols-2 gap-y-5 text-sm">
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
              Titular
            </p>
            <p className="font-medium text-slate-900">{sale.cliente_nombre}</p>
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
              Documento
            </p>
            <p className="font-medium text-slate-900">
              {sale.cliente_numero_doc}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-slate-400" />
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                Contacto
              </p>
              <p className="font-medium text-slate-900">
                {sale.cliente_telefono}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-slate-400" />
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                Correo
              </p>
              <p
                className="font-medium text-slate-900 truncate pr-2"
                title={sale.cliente_email}
              >
                {sale.cliente_email}
              </p>
            </div>
          </div>

          <div className="col-span-2 grid grid-cols-2 border-t pt-4 mt-2 border-dashed">
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                Madre
              </p>
              <p className="font-medium text-slate-700 text-xs">
                {sale.cliente_mama}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                Padre
              </p>
              <p className="font-medium text-slate-700 text-xs">
                {sale.cliente_papa}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden border-green-200 shadow-sm">
        <div className="bg-green-50 border-b border-green-100 p-3 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-green-600" />
          <h3 className="font-bold text-xs text-green-800 uppercase tracking-wider">
            Detalles de Instalación
          </h3>
        </div>
        <div className="p-4 grid grid-cols-1 gap-y-4 text-sm bg-white">
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
              Dirección Exacta
            </p>
            <p className="font-medium text-slate-900">
              {sale.direccion_detalle}
            </p>
            {sale.referencias && (
              <p className="text-xs text-slate-500 mt-1 italic">
                Ref: {sale.referencias}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4 border-t pt-4">
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                Plano
              </p>
              <p className="font-medium text-slate-900">{sale.plano}</p>
            </div>
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                Coordenadas
              </p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${sale.coordenadas_gps}`}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-blue-600 hover:underline"
              >
                {sale.coordenadas_gps || "No registradas"}
              </a>
            </div>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden border-blue-200 shadow-sm">
        <div className="bg-blue-50 border-b border-blue-100 p-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <h3 className="font-bold text-xs text-blue-800 uppercase tracking-wider">
            Operativa y Producto
          </h3>
        </div>
        <div className="p-4 grid grid-cols-2 gap-y-5 text-sm bg-white">
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
              Producto
            </p>
            <div className="flex items-center gap-2">
              <Box className="w-4 h-4 text-primary" />
              <p className="font-bold text-slate-900">
                {sale.nombre_producto || "Base"}
              </p>
            </div>
            <Badge variant="secondary" className="mt-1 text-[10px]">
              {sale.tecnologia}
            </Badge>
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
              Asesor Responsable
            </p>
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-slate-400" />
              <p className="font-medium text-slate-900">{sale.nombre_asesor}</p>
            </div>
          </div>

          <div className="col-span-2 grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-lg border">
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                Código SEC
              </p>
              <p className="font-mono text-sm font-bold text-slate-700">
                {sale.codigo_sec || "---"}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                Código SOT
              </p>
              <p className="font-mono text-sm font-bold text-slate-700">
                {sale.codigo_sot || "---"}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                Fecha Agenda
              </p>
              <p className="font-medium text-slate-700 text-xs">
                {sale.fecha_visita_programada || "Pendiente"}
              </p>
            </div>
          </div>

          <div className="col-span-2 pt-2 flex items-center justify-between">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
              Estado Final:
            </p>
            <Badge
              variant="outline"
              className={`px-3 py-1 shadow-sm ${sale.nombre_estado === "RECHAZADO" ? "bg-red-50 text-red-700 border-red-200" : "bg-slate-50"}`}
            >
              {sale.nombre_estado || "PENDIENTE"}
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  );
};
