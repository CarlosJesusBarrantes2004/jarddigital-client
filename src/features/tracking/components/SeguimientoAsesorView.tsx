import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Eye,
  CheckCircle2,
  XCircle,
  CreditCard,
  Calendar,
  Star,
  Minus,
  Phone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSeguimientos } from "../api";
import { formatDate, MESES_ES, getNombreProducto } from "../utils";
import { SeguimientoDrawer } from "./SeguimientoDrawer";
import type { Seguimiento, SeguimientoFilters } from "../types";

function MultiSelectCheckbox({
  values = [],
  onChange,
  options,
  placeholder,
  className,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  options: { label: string; value: string }[];
  placeholder: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  const toggle = (val: string) => {
    if (values.includes(val)) onChange(values.filter((v) => v !== val));
    else onChange([...values, val]);
  };

  const getLabel = () => {
    if (values.length === 0) return placeholder;
    if (values.length === 1)
      return options.find((o) => o.value === values[0])?.label;
    if (values.length === options.length) return "Todos los meses";
    return `${values.length} meses selec.`;
  };

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full h-8 pl-2.5 pr-7 rounded-lg border border-border bg-background text-[11px] text-foreground flex items-center focus:outline-none focus:ring-1 focus:ring-primary/50"
      >
        <span className="truncate flex-1 text-left">{getLabel()}</span>
        <ChevronDown
          size={12}
          className="absolute right-2 text-muted-foreground shrink-0"
        />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-[calc(100%+4px)] left-0 min-w-full w-max bg-popover border border-border rounded-xl shadow-xl z-50 py-1.5 flex flex-col max-h-[240px] overflow-y-auto animate-in fade-in slide-in-from-top-2">
            {options.map((o) => (
              <label
                key={o.value}
                className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-muted/50 cursor-pointer text-[11px] text-foreground transition-colors"
              >
                <input
                  type="checkbox"
                  checked={values.includes(o.value)}
                  onChange={() => toggle(o.value)}
                  className="rounded border-border accent-primary w-3.5 h-3.5"
                />
                {o.label}
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function groupByMesInstalacion(segs: Seguimiento[]) {
  const groups: Record<string, Seguimiento[]> = {};
  segs.forEach((s) => {
    if (!s.venta.fecha_real_inst) return;
    const [y, m] = s.venta.fecha_real_inst.split("-");
    const key = `${y}-${m}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(s);
  });
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
}

function mesLabel(key: string) {
  const [y, m] = key.split("-");
  return `${MESES_ES[parseInt(m) - 1]} ${y}`;
}

const ANIO_ACTUAL = new Date().getFullYear();
const ANIOS = [ANIO_ACTUAL - 1, ANIO_ACTUAL, ANIO_ACTUAL + 1];

function AsesorSeguimientoCard({
  seg,
  onView,
}: {
  seg: Seguimiento;
  onView: () => void;
}) {
  const mes1 = seg.meses_evaluados?.find((m) => m.mes_numero === 1);
  const primerMesPagado = mes1?.pago_cliente_realizado ?? false;

  const nombreProd = getNombreProducto(seg.venta);

  return (
    <div className="flex items-center gap-4 px-4 py-3.5 hover:bg-muted/30 transition-colors border-b border-border/30 last:border-0 group">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-[11px] font-bold text-primary shrink-0">
        {seg.venta.cliente_nombre?.substring(0, 2).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] font-semibold text-foreground truncate">
            {seg.venta.cliente_nombre}
          </span>
          {seg.venta.id_producto?.es_alto_valor && (
            <Star
              size={10}
              className="text-amber-500 fill-amber-500 shrink-0"
            />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-0.5">
          <span className="text-[10px] font-mono text-muted-foreground flex flex-wrap items-center gap-1.5">
            <span className="flex items-center gap-1">
              <span className="font-semibold text-foreground/70">SOT:</span>
              {seg.venta.codigo_sot}
            </span>

            {seg.venta.cliente_numero_doc && (
              <>
                <span className="text-border">•</span>
                <span className="flex items-center gap-1">
                  <span className="font-semibold text-foreground/70">
                    DNI/RUC:
                  </span>
                  {seg.venta.cliente_numero_doc}
                </span>
              </>
            )}

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
          {nombreProd !== "—" && (
            <span className="text-[10px] text-muted-foreground/70 hidden sm:block truncate max-w-[150px]">
              {nombreProd}
            </span>
          )}
        </div>
      </div>

      <div className="text-center hidden sm:block">
        <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
          Instalado
        </div>
        <div className="text-[12px] font-mono text-foreground mt-0.5">
          {formatDate(seg.venta.fecha_real_inst)}
        </div>
      </div>

      <div className="text-center w-28 hidden md:block">
        <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-0.5">
          Cód. Pago
        </div>
        {seg.codigo_pago ? (
          <div className="flex items-center justify-center gap-1 text-[11px] font-mono">
            <CreditCard size={10} className="text-primary" />
            <span>{seg.codigo_pago}</span>
          </div>
        ) : (
          <Minus size={12} className="text-muted-foreground/40 mx-auto" />
        )}
      </div>

      <div className="flex flex-col items-center gap-0.5 w-24 shrink-0">
        <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
          Mes 1
        </div>
        <div className="flex items-center gap-1.5">
          {primerMesPagado ? (
            <>
              <CheckCircle2 size={13} className="text-emerald-500" />
              <span className="text-[11px] font-semibold text-emerald-600">
                Pagado
              </span>
            </>
          ) : (
            <>
              <XCircle size={13} className="text-rose-400" />
              <span className="text-[11px] font-semibold text-rose-500">
                Pendiente
              </span>
            </>
          )}
        </div>
        {mes1?.fecha_validacion_pago && (
          <span className="text-[9px] font-mono text-muted-foreground">
            {formatDate(mes1.fecha_validacion_pago)}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={onView}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all opacity-0 group-hover:opacity-100 shrink-0"
      >
        <Eye size={13} />
      </button>
    </div>
  );
}

function MesGroup({
  mesKey,
  segs,
  onView,
}: {
  mesKey: string;
  segs: Seguimiento[];
  onView: (id: number) => void;
}) {
  const [open, setOpen] = useState(true);
  const pagados = segs.filter(
    (s) =>
      s.meses_evaluados?.find((m) => m.mes_numero === 1)
        ?.pago_cliente_realizado,
  ).length;

  return (
    <div className="border border-border rounded-xl overflow-hidden mb-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
      >
        <Calendar size={14} className="text-primary shrink-0" />
        <span className="flex-1 text-[13px] font-bold text-foreground">
          {mesLabel(mesKey)}
        </span>
        <span className="text-[11px] font-mono text-muted-foreground">
          {segs.length} ventas · {pagados}/{segs.length} pagados
        </span>
        <div className="w-24 h-1.5 rounded-full bg-border overflow-hidden hidden sm:block">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{
              width: `${segs.length > 0 ? (pagados / segs.length) * 100 : 0}%`,
            }}
          />
        </div>
        {open ? (
          <ChevronDown size={14} className="text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight size={14} className="text-muted-foreground shrink-0" />
        )}
      </button>

      {open && (
        <div className="divide-y-0">
          {segs.map((seg) => (
            <AsesorSeguimientoCard
              key={seg.id}
              seg={seg}
              onView={() => onView(seg.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function SeguimientoAsesorView() {
  const [filters, setFilters] = useState<SeguimientoFilters>(() => {
    const now = new Date();
    return {
      mes_instalacion: [now.getMonth() + 1],
      anio_instalacion: now.getFullYear(),
      page: 1,
      page_size: 50,
    };
  });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [showPrimerPago, setShowPrimerPago] = useState<boolean | undefined>(
    undefined,
  );

  const { data, isLoading } = useSeguimientos({
    ...filters,
    search: search || undefined,
    primer_mes_pagado: showPrimerPago,
  });

  const seguimientos = Array.isArray(data) ? data : (data?.results ?? []);
  const totalCount = Array.isArray(data) ? data.length : (data?.count ?? 0);

  const hasNext = !Array.isArray(data) && !!data?.next;
  const hasPrev = !Array.isArray(data) && !!data?.previous;
  const currentPage = filters.page ?? 1;

  const PAGE_SIZE = 50;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const groups = groupByMesInstalacion(seguimientos);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setFilters((prev) => ({ ...prev, page: 1 }));
  };

  const handleAnioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters({
      ...filters,
      anio_instalacion: e.target.value ? Number(e.target.value) : undefined,
      page: 1,
    });
  };

  const handlePrimerPagoToggle = (v: boolean | undefined) => {
    setShowPrimerPago(v);
    setFilters((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <div className="flex flex-col h-full">
      {/* CORRECCIÓN: relative z-30 y sin backdrop-blur */}
      <div className="p-4 border-b border-border bg-background shrink-0 space-y-3 relative z-30">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-[280px]">
            <input
              value={search}
              onChange={handleSearchChange}
              placeholder="Buscar por nombre o código..."
              className="w-full h-8 pl-8 pr-3 rounded-lg border border-border bg-background text-[12px] focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>

          <div className="flex items-center gap-2 mr-2">
            <MultiSelectCheckbox
              values={(filters.mes_instalacion ?? []).map(String)}
              onChange={(arr) =>
                setFilters((prev) => ({
                  ...prev,
                  mes_instalacion: arr.map(Number),
                  page: 1,
                }))
              }
              placeholder="Meses"
              options={MESES_ES.map((m, i) => ({
                label: m,
                value: String(i + 1),
              }))}
              className="w-[140px]"
            />
            <select
              value={filters.anio_instalacion ?? ""}
              onChange={handleAnioChange}
              className="h-8 pl-2 pr-6 rounded-lg border border-border bg-background text-[11px] focus:outline-none focus:ring-1 focus:ring-primary/50 cursor-pointer"
            >
              <option value="">Todo (Año)</option>
              {ANIOS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground font-mono">
              Mes 1:
            </span>
            {([undefined, true, false] as (boolean | undefined)[]).map((v) => (
              <button
                key={String(v)}
                type="button"
                onClick={() => handlePrimerPagoToggle(v)}
                className={cn(
                  "h-7 px-3 rounded-full text-[11px] font-semibold border transition-all",
                  showPrimerPago === v
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-transparent text-muted-foreground border-border hover:border-primary/40",
                )}
              >
                {v === undefined ? "Todos" : v ? "Pagado" : "Pendiente"}
              </button>
            ))}
          </div>

          <span className="text-[12px] text-muted-foreground ml-auto">
            {isLoading ? "Cargando..." : `${totalCount} ventas en total`}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }, (_, i) => (
              <div
                key={i}
                className="h-32 rounded-xl border border-border bg-muted/20 animate-pulse"
              />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-[13px] gap-2">
            <span>No hay ventas en seguimiento para este mes.</span>
            <button
              onClick={() => setFilters({})}
              className="text-primary hover:underline font-semibold"
            >
              Ver todo el historial
            </button>
          </div>
        ) : (
          groups.map(([key, segs]) => (
            <MesGroup
              key={key}
              mesKey={key}
              segs={segs}
              onView={setSelectedId}
            />
          ))
        )}
      </div>

      <div className="px-4 py-3 border-t border-border flex items-center justify-between bg-background shrink-0">
        <span className="text-[12px] font-medium text-muted-foreground">
          Página {currentPage} de {totalPages}
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
          isAsesor={true}
        />
      )}
    </div>
  );
}
