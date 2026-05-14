import { useState } from "react";
import {
  Eye,
  CheckCircle2,
  XCircle,
  ChevronUp,
  ChevronDown,
  Minus,
  CreditCard,
  Star,
  Phone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSeguimientos } from "../api";
// CORRECCIÓN QA: Importamos los extractores
import { formatDate, getNombreAsesor, getNombreProducto } from "../utils";
import { SeguimientoFilterBar } from "./SeguimientoFilterBar";
import { SeguimientoDrawer } from "./SeguimientoDrawer";
import type { Seguimiento, SeguimientoFilters } from "../types";

function PagoBadge({ paid }: { paid: boolean }) {
  return paid ? (
    <CheckCircle2 size={14} className="text-emerald-500" />
  ) : (
    <XCircle size={14} className="text-rose-400" />
  );
}

function EstadoTag({ estado }: { estado: string | null | undefined }) {
  if (!estado) return <Minus size={12} className="text-muted-foreground/40" />;
  const map: Record<string, string> = {
    PENALIZADO: "text-red-600 bg-red-500/10",
    SUSPENDIDO: "text-amber-600 bg-amber-500/10",
    DESACTIVADO: "text-zinc-500 bg-zinc-500/10",
  };
  return (
    <span
      className={cn(
        "text-[10px] font-mono font-bold px-1.5 py-0.5 rounded",
        map[estado],
      )}
    >
      {estado.charAt(0) + estado.slice(1).toLowerCase()}
    </span>
  );
}

function SeguimientoRow({
  seg,
  onView,
}: {
  seg: Seguimiento;
  onView: () => void;
}) {
  const meses =
    seg.meses_evaluados?.slice().sort((a, b) => a.mes_numero - b.mes_numero) ??
    [];

  return (
    <tr className="group border-b border-border/40 hover:bg-muted/30 transition-colors">
      <td className="px-3 py-3 min-w-[180px]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-[11px] font-bold text-primary shrink-0">
            {seg.venta.cliente_nombre?.substring(0, 2).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-semibold text-foreground truncate max-w-[140px]">
                {seg.venta.cliente_nombre}
              </span>
              {seg.venta.id_producto?.es_alto_valor && (
                <Star
                  size={10}
                  className="text-amber-500 shrink-0 fill-amber-500"
                />
              )}
            </div>
            <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1.5 mt-0.5">
              {seg.venta.codigo_sot}
              {seg.venta.cliente_telefono && (
                <>
                  <span className="text-border">•</span>
                  <span className="flex items-center gap-0.5">
                    <Phone size={9} />
                    {seg.venta.cliente_telefono}
                  </span>
                </>
              )}
            </span>
          </div>
        </div>
      </td>

      <td className="px-3 py-3 text-center">
        <span
          className={cn(
            "text-[10px] font-mono font-bold w-6 h-6 rounded-full flex items-center justify-center mx-auto",
            seg.venta.cliente_genero === "F"
              ? "bg-pink-500/15 text-pink-600"
              : "bg-blue-500/15 text-blue-600",
          )}
        >
          {seg.venta.cliente_genero ?? "—"}
        </span>
      </td>

      {/* CORRECCIÓN QA: Uso del extractor de Asesor */}
      <td className="px-3 py-3">
        <span
          className="text-[11px] font-medium text-foreground truncate block max-w-[120px]"
          title={getNombreAsesor(seg.venta)}
        >
          {getNombreAsesor(seg.venta)}
        </span>
      </td>

      {/* CORRECCIÓN QA: Uso del extractor de Producto */}
      <td className="px-3 py-3">
        <span
          className="text-[11px] text-muted-foreground truncate block max-w-[120px]"
          title={getNombreProducto(seg.venta)}
        >
          {getNombreProducto(seg.venta)}
        </span>
      </td>

      <td className="px-3 py-3 text-center">
        <span className="text-[12px] text-muted-foreground font-mono">
          {formatDate(seg.venta.fecha_real_inst)}
        </span>
      </td>

      <td className="px-3 py-3 text-center">
        <span className="text-[12px] text-foreground font-mono">
          {formatDate(seg.ciclo_facturacion)}
        </span>
      </td>

      <td className="px-3 py-3">
        {seg.codigo_pago ? (
          <div className="flex items-center gap-1.5">
            <CreditCard size={11} className="text-primary shrink-0" />
            <span className="text-[11px] font-mono text-foreground">
              {seg.codigo_pago}
            </span>
          </div>
        ) : (
          <Minus size={12} className="text-muted-foreground/40" />
        )}
      </td>

      {Array.from({ length: 6 }, (_, i) => {
        const mes = meses.find((m) => m.mes_numero === i + 1);
        return (
          <td key={i} className="px-2 py-3 text-center relative">
            {mes ? (
              <div className="flex flex-col items-center gap-1">
                <PagoBadge paid={mes.pago_cliente_realizado} />

                {mes.conformidad && (
                  <div className="group relative flex justify-center">
                    <span
                      className={cn(
                        "text-[9px] font-mono font-bold cursor-help",
                        mes.conformidad === "CONFORME"
                          ? "text-blue-500"
                          : "text-orange-500",
                      )}
                    >
                      {mes.conformidad.substring(0, 3)}
                    </span>
                    {mes.conformidad === "INCONFORME" && mes.observacion && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 bg-popover/95 backdrop-blur text-popover-foreground text-[10px] font-medium leading-relaxed rounded-lg shadow-xl border border-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none text-left">
                        {mes.observacion}
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-popover border-b border-r border-border rotate-45" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <Minus size={12} className="text-muted-foreground/20 mx-auto" />
            )}
          </td>
        );
      })}

      <td className="px-3 py-3 text-center">
        <EstadoTag estado={seg.estado} />
      </td>

      <td className="px-3 py-3 text-center">
        {seg.descuento_realizado ? (
          <CheckCircle2 size={13} className="text-emerald-500 mx-auto" />
        ) : (
          <Minus size={12} className="text-muted-foreground/30 mx-auto" />
        )}
      </td>

      <td className="px-3 py-3">
        <button
          type="button"
          onClick={onView}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all opacity-0 group-hover:opacity-100"
        >
          <Eye size={13} />
        </button>
      </td>
    </tr>
  );
}

export function SeguimientoTable() {
  const [filters, setFilters] = useState<SeguimientoFilters>(() => {
    const now = new Date();
    return {
      mes_instalacion: now.getMonth() + 1,
      anio_instalacion: now.getFullYear(),
      page: 1,
    };
  });

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [ordering, setOrdering] = useState<string>(
    "-id_venta__fecha_real_inst",
  );

  const { data, isLoading } = useSeguimientos({ ...filters, ordering });

  const seguimientos = Array.isArray(data) ? data : (data?.results ?? []);
  const totalCount = Array.isArray(data) ? data.length : (data?.count ?? 0);

  const hasNext = !Array.isArray(data) && !!data?.next;
  const hasPrev = !Array.isArray(data) && !!data?.previous;
  const currentPage = filters.page ?? 1;

  const toggleOrder = (field: string) => {
    setOrdering((prev) => (prev === field ? `-${field}` : field));
  };

  const ThCol = ({
    label,
    field,
    className,
  }: {
    label: string;
    field?: string;
    className?: string;
  }) => (
    <th
      className={cn(
        "px-3 py-3 text-left text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap",
        field && "cursor-pointer hover:text-foreground select-none",
        className,
      )}
      onClick={field ? () => toggleOrder(field) : undefined}
    >
      <div className="flex items-center gap-1">
        {label}
        {field &&
          ordering.replace("-", "") === field &&
          (ordering.startsWith("-") ? (
            <ChevronDown size={10} />
          ) : (
            <ChevronUp size={10} />
          ))}
      </div>
    </th>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border bg-background/60 backdrop-blur-sm shrink-0">
        <SeguimientoFilterBar
          filters={filters}
          onChange={setFilters}
          role="encargado"
        />
      </div>

      <div className="px-4 py-2.5 flex items-center gap-2 shrink-0">
        <span className="text-[12px] text-muted-foreground">
          {isLoading ? "Cargando..." : `${totalCount} seguimientos`}
        </span>
        {totalCount > 0 && (
          <span className="text-[11px] font-mono text-muted-foreground/60">
            · mostrando {seguimientos.length}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-auto [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full">
        <table className="w-full border-collapse min-w-[1300px]">
          <thead className="sticky top-0 bg-background/95 backdrop-blur-sm z-10">
            <tr className="border-b border-border">
              <ThCol label="Cliente" field="id_venta__cliente_nombre" />
              <ThCol label="G." className="text-center" />
              <ThCol label="Asesor" field="id_venta__id_asesor__nombre" />
              <ThCol label="Producto" />
              <ThCol
                label="F. Inst."
                field="id_venta__fecha_real_inst"
                className="text-center"
              />
              <ThCol
                label="Ciclo"
                field="ciclo_facturacion"
                className="text-center"
              />
              <ThCol label="Cód. Pago" />
              {Array.from({ length: 6 }, (_, i) => (
                <th
                  key={i}
                  className="px-2 py-3 text-center text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground"
                >
                  M{i + 1}
                </th>
              ))}
              <ThCol label="Estado" className="text-center" />
              <ThCol label="Dto." className="text-center" />
              <th className="px-3 py-3 w-10" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }, (_, i) => (
                <tr key={i} className="border-b border-border/30">
                  {Array.from({ length: 16 }, (_, j) => (
                    <td key={j} className="px-3 py-3">
                      <div className="h-4 bg-muted rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : seguimientos.length === 0 ? (
              <tr>
                <td
                  colSpan={16}
                  className="px-3 py-16 text-center text-muted-foreground text-[13px]"
                >
                  No se encontraron seguimientos con los filtros actuales.
                </td>
              </tr>
            ) : (
              seguimientos.map((seg) => (
                <SeguimientoRow
                  key={seg.id}
                  seg={seg}
                  onView={() => setSelectedId(seg.id)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 border-t border-border flex items-center justify-between bg-background shrink-0">
        <span className="text-[12px] font-medium text-muted-foreground">
          Página {currentPage}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              setFilters({ ...filters, page: Math.max(1, currentPage - 1) })
            }
            disabled={!hasPrev || isLoading}
            className="h-8 px-3 rounded-lg border border-border text-[12px] font-medium text-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
          >
            Anterior
          </button>
          <button
            onClick={() => setFilters({ ...filters, page: currentPage + 1 })}
            disabled={!hasNext || isLoading}
            className="h-8 px-3 rounded-lg border border-border text-[12px] font-medium text-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
          >
            Siguiente
          </button>
        </div>
      </div>

      {selectedId !== null && (
        <SeguimientoDrawer
          seguimientoId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
