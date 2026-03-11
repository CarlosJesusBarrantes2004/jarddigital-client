import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2, RotateCcw, Star, Package } from "lucide-react";
import type { Producto } from "../types/productos.types";
import { Badge } from "./Badge";
import { cn } from "@/lib/utils";
import { IconBtn } from "./IconBtn";

export function buildColumnsProductos(
  onEditar: (p: Producto) => void,
  onEliminar: (p: Producto) => void,
  onReactivar: (p: Producto) => void,
): ColumnDef<Producto>[] {
  return [
    {
      accessorKey: "id",
      header: "#",
      size: 52,
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground/70">
          #{row.original.id}
        </span>
      ),
    },
    {
      // Usamos nombre_paquete en lugar de nombre_plan
      accessorKey: "nombre_paquete",
      header: "Paquete",
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div className="flex items-start gap-3">
            {/* Icono decorativo */}
            <div className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0 bg-primary/10 border border-primary/20 mt-0.5">
              <Package size={14} className="text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground mb-0.5 leading-tight">
                {p.nombre_paquete}
              </p>
              <p className="text-[11px] text-muted-foreground font-mono tracking-tight">
                ID: {p.id}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "nombre_campana",
      header: "Campaña",
      cell: ({ row }) => (
        <div>
          <p className="text-[13px] text-foreground/80 font-medium">
            {row.original.nombre_campana}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {row.original.tipo_solucion}
          </p>
        </div>
      ),
    },
    {
      id: "precios",
      header: "Costo / Comisión",
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-muted-foreground w-8">
                COSTO
              </span>
              <span className="font-mono text-sm font-semibold text-foreground">
                S/ {Number(p.costo_fijo_plan).toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-muted-foreground w-8">
                COM.
              </span>
              <span className="font-mono text-sm font-semibold text-emerald-500">
                S/ {Number(p.comision_base).toFixed(2)}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      id: "tags",
      header: "Etiquetas",
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div className="flex flex-wrap gap-1.5">
            {p.es_alto_valor && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-widest bg-[#C9975A]/10 border border-[#C9975A]/30 text-[#C9975A] uppercase">
                <Star size={10} className="fill-current" /> Alto Valor
              </span>
            )}
            <Badge
              label={p.tipo_solucion}
              colorClass="text-primary"
              bgClass="bg-primary/10"
              borderClass="border-primary/20"
            />
          </div>
        );
      },
    },
    {
      id: "vigencia",
      header: "Vigencia",
      cell: ({ row }) => {
        const p = row.original;
        const inicio = new Date(p.fecha_inicio_vigencia);
        const fin = p.fecha_fin_vigencia
          ? new Date(p.fecha_fin_vigencia)
          : null;
        const vencida = fin && fin < new Date();

        return (
          <div className="flex flex-col gap-0.5">
            <p className="font-mono text-[11px] text-foreground/70">
              {inicio.toLocaleDateString("es-PE", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </p>
            {fin && (
              <p
                className={cn(
                  "font-mono text-[10px] mt-0.5",
                  vencida ? "text-destructive" : "text-muted-foreground",
                )}
              >
                →{" "}
                {fin.toLocaleDateString("es-PE", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
                {vencida && " · Vencida"}
              </p>
            )}
            {!fin && (
              <p className="font-mono text-[10px] text-emerald-500/80 mt-0.5">
                Sin vencimiento
              </p>
            )}
          </div>
        );
      },
    },
    {
      id: "estado",
      header: "Estado",
      cell: ({ row }) => {
        const activo = row.original.activo;
        return (
          <Badge
            label={activo ? "Activo" : "Inactivo"}
            colorClass={activo ? "text-emerald-500" : "text-destructive"}
            bgClass={activo ? "bg-emerald-500/10" : "bg-destructive/10"}
            borderClass={
              activo ? "border-emerald-500/20" : "border-destructive/20"
            }
            dim={!activo}
          />
        );
      },
    },
    {
      id: "acciones",
      header: "",
      size: 110,
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div className="flex items-center gap-1.5">
            <IconBtn
              onClick={() => onEditar(p)}
              title="Editar"
              colorClass="text-primary"
              bgClass="bg-primary/10 border-primary/20"
              hoverClass="hover:bg-primary/20"
            >
              <Pencil size={14} />
            </IconBtn>
            {p.activo ? (
              <IconBtn
                onClick={() => onEliminar(p)}
                title="Desactivar"
                colorClass="text-destructive"
                bgClass="bg-destructive/10 border-destructive/20"
                hoverClass="hover:bg-destructive/20"
              >
                <Trash2 size={14} />
              </IconBtn>
            ) : (
              <IconBtn
                onClick={() => onReactivar(p)}
                title="Reactivar"
                colorClass="text-emerald-500"
                bgClass="bg-emerald-500/10 border-emerald-500/20"
                hoverClass="hover:bg-emerald-500/20"
              >
                <RotateCcw size={14} />
              </IconBtn>
            )}
          </div>
        );
      },
    },
  ];
}
