import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Settings, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EstadoBadge } from "../EstadoBadge";
import type { Venta, EstadoSOT } from "../../types/sales.types";

export function buildColumnsBackoffice(
  estadosSOT: EstadoSOT[],
  onGestionar: (v: Venta) => void,
): ColumnDef<Venta>[] {
  return [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => {
        const v = row.original;
        return (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-xs text-zinc-500">#{v.id}</span>
            {!!v.venta_origen && (
              <Badge
                className="bg-amber-100 px-1.5 py-0 text-[10px] font-bold text-amber-700 hover:bg-amber-100"
                title={`Reingreso de venta #${v.venta_origen}`}
              >
                ↩ REINGRESADA
              </Badge>
            )}
          </div>
        );
      },
      size: 80,
    },
    {
      accessorKey: "nombre_asesor",
      header: "Asesor",
      cell: ({ row }) => (
        <span className="text-sm font-medium">
          {row.original.nombre_asesor}
        </span>
      ),
    },
    {
      accessorKey: "cliente_nombre",
      header: "Cliente",
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-zinc-800">
            {row.original.cliente_nombre}
          </p>
          <p className="text-xs text-zinc-500">
            {row.original.cliente_numero_doc}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "nombre_producto",
      header: "Plan",
    },
    {
      accessorKey: "codigo_sec",
      header: "SEC / SOT",
      cell: ({ row }) => {
        const {
          codigo_sec,
          codigo_sot,
          codigo_sec_origen,
          codigo_sot_origen,
          venta_origen,
        } = row.original;
        // Mostramos el código propio si ya existe, o el de origen entre paréntesis
        const secMostrar =
          codigo_sec || (venta_origen ? codigo_sec_origen : null);
        const sotMostrar =
          codigo_sot || (venta_origen ? codigo_sot_origen : null);
        const sonDeOrigen =
          !codigo_sec &&
          !codigo_sot &&
          !!(codigo_sec_origen || codigo_sot_origen);
        return (
          <div className="space-y-0.5">
            {secMostrar ? (
              <p
                className={`font-mono text-xs ${sonDeOrigen ? "text-amber-600" : ""}`}
              >
                <span className="text-zinc-400">SEC:</span> {secMostrar}
                {sonDeOrigen && (
                  <span className="ml-1 text-[10px]">(anterior)</span>
                )}
              </p>
            ) : (
              <p className="text-xs text-zinc-400 italic">SEC pendiente</p>
            )}
            {sotMostrar ? (
              <p
                className={`font-mono text-xs ${sonDeOrigen ? "text-amber-600" : ""}`}
              >
                <span className="text-zinc-400">SOT:</span> {sotMostrar}
                {sonDeOrigen && (
                  <span className="ml-1 text-[10px]">(anterior)</span>
                )}
              </p>
            ) : (
              <p className="text-xs text-zinc-400 italic">SOT pendiente</p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "id_estado_sot",
      header: "Estado SOT",
      cell: ({ row }) => {
        const estadoData = estadosSOT.find(
          (e) => e.id === row.original.id_estado_sot,
        );
        return (
          <EstadoBadge
            estado={
              estadoData
                ? {
                    nombre: estadoData.nombre,
                    codigo: estadoData.codigo,
                    color_hex: estadoData.color_hex,
                  }
                : null
            }
            esReingresada={!!row.original.venta_origen}
          />
        );
      },
    },
    {
      accessorKey: "fecha_visita_programada",
      header: "Visita",
      cell: ({ row }) =>
        row.original.fecha_visita_programada ? (
          <div>
            <p className="text-sm">
              {format(
                new Date(row.original.fecha_visita_programada),
                "dd MMM yyyy",
                { locale: es },
              )}
            </p>
            {row.original.bloque_horario && (
              <p className="text-xs text-zinc-500">
                {row.original.bloque_horario}
              </p>
            )}
          </div>
        ) : (
          <span className="text-xs text-zinc-400">Sin programar</span>
        ),
    },
    {
      accessorKey: "solicitud_correccion",
      header: "Corrección",
      cell: ({ row }) =>
        row.original.solicitud_correccion ? (
          <div className="flex items-center gap-1 text-amber-600">
            <AlertCircle className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Pendiente corrección</span>
          </div>
        ) : null,
    },
    {
      id: "acciones",
      header: "",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 px-2 text-xs"
          onClick={() => onGestionar(row.original)}
        >
          <Settings className="h-3.5 w-3.5" />
          Gestionar
        </Button>
      ),
    },
  ];
}
