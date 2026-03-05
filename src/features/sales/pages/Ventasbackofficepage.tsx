import { useState } from "react";
import { Search, RefreshCw, Filter, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  useVentas,
  useEstadosSOT,
  useEstadosAudio,
  useProductos,
} from "../hooks/useSales";
import type { Venta, VentaFiltros } from "../types/sales.types";
import { DataTable } from "../components/VentasTable";
import { buildColumnsBackoffice } from "../components/VentasTable/ColumnsBackoffice";
import { VentaFormBackoffice } from "../components/VentaFormBackoffice";

// ── Componentes de UI Internos ──
function FilterChip({
  label,
  active,
  colorClass,
  bgClass,
  onClick,
}: {
  label: string;
  active?: boolean;
  colorClass: string;
  bgClass: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-1.5 rounded-full text-xs font-sans transition-all duration-200 border whitespace-nowrap",
        active
          ? cn(bgClass, colorClass, "border-current/30 font-semibold shadow-sm")
          : "bg-card border-border text-muted-foreground hover:bg-muted",
      )}
    >
      {label}
    </button>
  );
}

function Select({
  value,
  onChange,
  children,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 bg-background border border-border rounded-xl pl-4 pr-10 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary/20 appearance-none outline-none transition-all cursor-pointer"
      >
        <option value="todos">{placeholder}</option>
        {children}
      </select>
      <ChevronDown
        size={14}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
      />
    </div>
  );
}

export function VentasBackofficePage() {
  const [ventaSeleccionada, setVentaSeleccionada] = useState<Venta | null>(
    null,
  );
  const [filtros, setFiltros] = useState<VentaFiltros>({});
  const [busqueda, setBusqueda] = useState("");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useVentas({ ...filtros, page });
  const { data: estadosSOT = [] } = useEstadosSOT();
  const { data: estadosAudio = [] } = useEstadosAudio();
  const { data: productos = [] } = useProductos();

  const ventas = data?.results ?? [];

  const filtrosActivos = Object.entries(filtros).filter(
    ([k, v]) => v !== undefined && v !== "" && v !== null && k !== "search",
  ).length;

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    setFiltros((f) => ({ ...f, search: busqueda }));
    setPage(1);
  };

  const limpiarFiltros = () => {
    setFiltros({});
    setBusqueda("");
    setPage(1);
  };

  const idEjecucion = estadosSOT.find((e) => e.codigo === "EJECUCION")?.id;
  const idAtendido = estadosSOT.find((e) => e.codigo === "ATENDIDO")?.id;
  const idRechazado = estadosSOT.find((e) => e.codigo === "RECHAZADO")?.id;

  const columns = buildColumnsBackoffice(estadosSOT, (v) =>
    setVentaSeleccionada(v),
  );

  return (
    <div className="font-sans min-h-screen bg-background text-foreground transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6 lg:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* ── HEADER ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] tracking-widest uppercase text-primary mb-1.5 font-semibold">
              Backoffice & Control
            </p>
            <h1 className="font-serif text-3xl md:text-4xl font-bold leading-tight tracking-tight mb-1.5">
              Gestión de Ventas
            </h1>
            <p className="text-sm text-muted-foreground font-light">
              {data?.count !== undefined ? (
                <>
                  <strong className="text-primary font-mono font-semibold">
                    {data.count}
                  </strong>{" "}
                  ventas encontradas
                </>
              ) : (
                "Cargando…"
              )}
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="inline-flex justify-center items-center gap-2 px-5 py-2.5 rounded-xl bg-card border border-border text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all shadow-sm"
          >
            <RefreshCw size={16} /> Refrescar
          </button>
        </div>

        {/* ── CHIPS RÁPIDOS ── */}
        <div className="flex flex-wrap gap-2.5">
          <FilterChip
            label="Todos"
            active={Object.keys(filtros).length === 0}
            colorClass="text-foreground"
            bgClass="bg-muted"
            onClick={limpiarFiltros}
          />
          <FilterChip
            label="Pendientes"
            active={filtros.id_estado_sot === "null"}
            colorClass="text-amber-500"
            bgClass="bg-amber-500/10"
            onClick={() =>
              setFiltros((f) => ({
                ...f,
                id_estado_sot: f.id_estado_sot === "null" ? undefined : "null",
                solicitud_correccion: undefined,
              }))
            }
          />
          {idEjecucion && (
            <FilterChip
              label="En Ejecución"
              active={filtros.id_estado_sot === String(idEjecucion)}
              colorClass="text-blue-500"
              bgClass="bg-blue-500/10"
              onClick={() =>
                setFiltros((f) => ({
                  ...f,
                  id_estado_sot:
                    f.id_estado_sot === String(idEjecucion)
                      ? undefined
                      : String(idEjecucion),
                }))
              }
            />
          )}
          {idAtendido && (
            <FilterChip
              label="Atendidas"
              active={filtros.id_estado_sot === String(idAtendido)}
              colorClass="text-emerald-500"
              bgClass="bg-emerald-500/10"
              onClick={() =>
                setFiltros((f) => ({
                  ...f,
                  id_estado_sot:
                    f.id_estado_sot === String(idAtendido)
                      ? undefined
                      : String(idAtendido),
                }))
              }
            />
          )}
          {idRechazado && (
            <FilterChip
              label="Rechazadas"
              active={filtros.id_estado_sot === String(idRechazado)}
              colorClass="text-destructive"
              bgClass="bg-destructive/10"
              onClick={() =>
                setFiltros((f) => ({
                  ...f,
                  id_estado_sot:
                    f.id_estado_sot === String(idRechazado)
                      ? undefined
                      : String(idRechazado),
                }))
              }
            />
          )}
          <FilterChip
            label="En corrección"
            active={filtros.solicitud_correccion === true}
            colorClass="text-orange-500"
            bgClass="bg-orange-500/10"
            onClick={() =>
              setFiltros((f) => ({
                ...f,
                solicitud_correccion:
                  f.solicitud_correccion === true ? undefined : true,
                id_estado_sot: undefined,
              }))
            }
          />
        </div>

        {/* ── BÚSQUEDA Y FILTROS AVANZADOS ── */}
        <div className="flex flex-col gap-3 bg-card border border-border p-3 rounded-2xl shadow-sm">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <form
              onSubmit={handleBuscar}
              className="flex-1 w-full relative flex items-center gap-2"
            >
              <Search
                size={16}
                className="absolute left-4 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Buscar por cliente, DNI, SOT, SEC, asesor…"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full h-11 bg-background border border-border rounded-xl pl-11 pr-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all"
              />
              <button
                type="submit"
                className="hidden lg:block h-11 px-6 rounded-xl bg-muted border border-border text-xs font-semibold hover:bg-muted/80 transition-colors"
              >
                Buscar
              </button>
            </form>
            <div className="flex w-full sm:w-auto gap-2">
              <button
                onClick={() => setMostrarFiltros(!mostrarFiltros)}
                className={cn(
                  "flex-1 sm:flex-none h-11 px-5 flex items-center justify-center gap-2 rounded-xl border text-xs font-semibold transition-colors",
                  mostrarFiltros
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-background border-border text-muted-foreground hover:bg-muted",
                )}
              >
                <Filter size={14} /> Filtros{" "}
                {filtrosActivos > 0 && (
                  <span className="w-4 h-4 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[9px]">
                    {filtrosActivos}
                  </span>
                )}
              </button>
              {(filtrosActivos > 0 || busqueda) && (
                <button
                  onClick={limpiarFiltros}
                  className="flex-1 sm:flex-none h-11 px-4 rounded-xl bg-transparent border border-border text-xs font-medium text-muted-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2"
                >
                  <X size={14} />{" "}
                  <span className="hidden sm:inline">Limpiar</span>
                </button>
              )}
            </div>
          </div>

          {mostrarFiltros && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-border animate-in fade-in slide-in-from-top-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono font-semibold uppercase tracking-widest text-muted-foreground">
                  Estado SOT
                </label>
                <Select
                  value={
                    filtros.id_estado_sot
                      ? String(filtros.id_estado_sot)
                      : "todos"
                  }
                  onChange={(v) =>
                    setFiltros({
                      ...filtros,
                      id_estado_sot: v === "todos" ? undefined : v,
                    })
                  }
                  placeholder="Todos los estados"
                >
                  <option value="null">Sin estado (pendiente)</option>
                  {estadosSOT.map((e) => (
                    <option key={e.id} value={String(e.id)}>
                      {e.nombre}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono font-semibold uppercase tracking-widest text-muted-foreground">
                  Estado Audios
                </label>
                <Select
                  value={
                    filtros.id_estado_audios
                      ? String(filtros.id_estado_audios)
                      : "todos"
                  }
                  onChange={(v) =>
                    setFiltros({
                      ...filtros,
                      id_estado_audios: v === "todos" ? undefined : v,
                    })
                  }
                  placeholder="Todos"
                >
                  {estadosAudio.map((ea) => (
                    <option key={ea.id} value={String(ea.id)}>
                      {ea.nombre}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono font-semibold uppercase tracking-widest text-muted-foreground">
                  Plan / Producto
                </label>
                <Select
                  value={
                    filtros.id_producto ? String(filtros.id_producto) : "todos"
                  }
                  onChange={(v) =>
                    setFiltros({
                      ...filtros,
                      id_producto: v === "todos" ? undefined : v,
                    })
                  }
                  placeholder="Todos los planes"
                >
                  {productos.map((p) => (
                    <option key={p.id} value={String(p.id)}>
                      {p.nombre_plan}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* ── TABLA ── */}
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden mb-4">
          <DataTable
            columns={columns}
            data={ventas}
            isLoading={isLoading}
            emptyMessage="No hay ventas que coincidan con los filtros aplicados"
          />
        </div>

        {/* ── PAGINACIÓN ── */}
        {data && (data.next || data.previous) && (
          <div className="flex items-center justify-between text-xs text-muted-foreground px-2">
            <span>
              <strong className="text-foreground">{data.count}</strong> ventas
              en total
            </span>
            <div className="flex gap-2">
              <button
                disabled={!data.previous}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-4 py-2 rounded-lg bg-card border border-border disabled:opacity-50 hover:bg-muted transition-colors"
              >
                Anterior
              </button>
              <button
                disabled={!data.next}
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 rounded-lg bg-card border border-border disabled:opacity-50 hover:bg-muted transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL BACKOFFICE ── */}
      {ventaSeleccionada && (
        <VentaFormBackoffice
          key={ventaSeleccionada.id}
          open={!!ventaSeleccionada}
          onClose={() => setVentaSeleccionada(null)}
          venta={ventaSeleccionada}
        />
      )}
    </div>
  );
}
