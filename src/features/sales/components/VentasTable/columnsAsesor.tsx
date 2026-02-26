import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { RotateCcw, Eye, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EstadoBadge } from "../EstadoBadge";
import type { Venta, EstadoSOT } from "../../types/sales.types";

function AccionesAsesor({
  venta,
  onReingresar,
  onVer,
}: {
  venta: Venta;
  onReingresar: (v: Venta) => void;
  onVer?: (v: Venta) => void;
}) {
  const esRechazada = venta.codigo_estado?.toUpperCase() === "RECHAZADO";
  return (
    <div className="flex items-center gap-1">
      {onVer && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-zinc-500 hover:text-zinc-700"
          onClick={() => onVer(venta)}
          title="Ver detalle"
        >
          <Eye className="h-3.5 w-3.5" />
        </Button>
      )}
      {esRechazada && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-1 px-2 text-xs text-amber-600 hover:bg-amber-50 hover:text-amber-700"
          onClick={() => onReingresar(venta)}
          title="Reingresar venta"
        >
          <RotateCcw className="h-3 w-3" />
          Reingresar
        </Button>
      )}
    </div>
  );
}

export function buildColumnsAsesor(
  estadosSOT: EstadoSOT[],
  onReingresar: (v: Venta) => void,
  onVer?: (v: Venta) => void,
): ColumnDef<Venta>[] {
  return [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-zinc-500">
          #{row.original.id}
        </span>
      ),
      size: 60,
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
      header: "Plan / Tecnología",
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-medium">{row.original.nombre_producto}</p>
          <Badge variant="outline" className="mt-0.5 text-xs font-mono">
            {row.original.tecnologia}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: "id_estado_sot",
      header: "Estado",
      cell: ({ row }) => {
        const v = row.original;
        const esRechazada = v.codigo_estado?.toUpperCase() === "RECHAZADO";
        const estadoData = estadosSOT.find((e) => e.id === v.id_estado_sot);
        return (
          <div className="space-y-1">
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
            />
            {/* Motivo de rechazo visible para el asesor */}
            {esRechazada && v.comentario_gestion && (
              <div className="flex items-start gap-1 rounded-md border border-red-100 bg-red-50 px-2 py-1">
                <AlertCircle className="mt-0.5 h-3 w-3 shrink-0 text-red-500" />
                <p className="text-xs text-red-700 leading-tight line-clamp-2">
                  {v.comentario_gestion}
                </p>
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "fecha_visita_programada",
      header: "Visita",
      cell: ({ row }) =>
        row.original.fecha_visita_programada ? (
          <span className="text-sm">
            {format(
              new Date(row.original.fecha_visita_programada),
              "dd MMM yyyy",
              { locale: es },
            )}
          </span>
        ) : (
          <span className="text-xs text-zinc-400">Sin programar</span>
        ),
    },
    {
      accessorKey: "fecha_creacion",
      header: "Creada",
      cell: ({ row }) => (
        <span className="text-xs text-zinc-500">
          {format(new Date(row.original.fecha_creacion), "dd/MM/yyyy HH:mm")}
        </span>
      ),
    },
    {
      id: "acciones",
      header: "",
      cell: ({ row }) => (
        <AccionesAsesor
          venta={row.original}
          onReingresar={onReingresar}
          onVer={onVer}
        />
      ),
      size: 110,
    },
  ];
}
