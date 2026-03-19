import { useState, useEffect, useRef } from "react";
import {
  Search,
  RefreshCw,
  Filter,
  X,
  ChevronDown,
  FileDown,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import {
  useVentas,
  useEstadosSOT,
  useEstadosAudio,
  useProductos,
} from "../hooks/useSales";
import { salesService } from "../services/sales.service";
import type { Venta, VentaFiltros } from "../types/sales.types";
import { DataTable } from "../components/VentasTable";
import { buildColumnsBackoffice } from "../components/VentasTable/columnsBackoffice";
import { VentaFormBackoffice } from "../components/VentaFormBackoffice";

// ── Debounce hook ─────────────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ── UI helpers ────────────────────────────────────────────────────────────────
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

// ── Filtros extendidos ────────────────────────────────────────────────────────
interface FiltrosLocales extends VentaFiltros {
  _pendientes?: boolean;
}

function buildFiltrosApi(f: FiltrosLocales): VentaFiltros {
  const { _pendientes, ...rest } = f;
  if (_pendientes) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id_estado_sot, ...sinEstado } = rest;
    return { ...sinEstado, id_estado_sot__isnull: true } as VentaFiltros;
  }
  return rest;
}

// ─────────────────────────────────────────────────────────────────────────────

interface VentasBackofficePageProps {
  soloLectura?: boolean;
}

export function VentasBackofficePage({
  soloLectura = false,
}: VentasBackofficePageProps) {
  const [ventaSeleccionada, setVentaSeleccionada] = useState<Venta | null>(
    null,
  );
  const [filtros, setFiltros] = useState<FiltrosLocales>({});
  const [busqueda, setBusqueda] = useState("");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [page, setPage] = useState(1);

  // ── Estado para exportación ──────────────────────────────────────────────
  const [exportando, setExportando] = useState(false);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [mostrarExport, setMostrarExport] = useState(false);

  const busquedaDebounced = useDebounce(busqueda, 350);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setFiltros((f) => ({ ...f, search: busquedaDebounced || undefined }));
    setPage(1);
  }, [busquedaDebounced]);

  const filtrosApi = buildFiltrosApi({ ...filtros, page });

  const { data, isLoading, refetch } = useVentas(filtrosApi);
  const { data: estadosSOT = [] } = useEstadosSOT();
  const { data: estadosAudio = [] } = useEstadosAudio();
  const { data: productosRaw = [] } = useProductos();

  const productos = Array.isArray(productosRaw)
    ? productosRaw
    : ((productosRaw as { results?: typeof productosRaw }).results ?? []);

  const ventas = data?.results ?? [];

  const filtrosActivos =
    Object.entries(filtros).filter(
      ([k, v]) =>
        v !== undefined &&
        v !== "" &&
        v !== null &&
        k !== "search" &&
        k !== "page" &&
        k !== "_pendientes",
    ).length + (filtros._pendientes ? 1 : 0);

  const limpiarFiltros = () => {
    setFiltros({});
    setBusqueda("");
    setPage(1);
  };

  const idEjecucion = estadosSOT.find((e) => e.codigo === "EJECUCION")?.id;
  const idAtendido = estadosSOT.find((e) => e.codigo === "ATENDIDO")?.id;
  const idRechazado = estadosSOT.find((e) => e.codigo === "RECHAZADO")?.id;

  const columns = buildColumnsBackoffice(
    estadosSOT,
    estadosAudio,
    soloLectura ? null : (v) => setVentaSeleccionada(v),
  );

  // ── Handler de exportación ────────────────────────────────────────────────
  const handleExportar = async () => {
    if (fechaInicio && fechaFin && fechaInicio > fechaFin) {
      toast.error("La fecha de inicio no puede ser posterior a la fecha fin.");
      return;
    }
    try {
      setExportando(true);
      toast.loading("Generando Excel…", { id: "export-excel" });
      await salesService.exportarExcel(
        fechaInicio || undefined,
        fechaFin || undefined,
      );
      toast.success("Excel descargado correctamente", { id: "export-excel" });
      setMostrarExport(false);
    } catch {
      toast.error("Error al generar el Excel. Intenta de nuevo.", {
        id: "export-excel",
      });
    } finally {
      setExportando(false);
    }
  };

  return (
    <div className="font-sans min-h-screen bg-background text-foreground transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6 lg:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* ── HEADER ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] tracking-widest uppercase text-primary mb-1.5 font-semibold">
              {soloLectura ? "Visión Global" : "Backoffice & Control"}
            </p>
            <h1 className="font-serif text-3xl md:text-4xl font-bold leading-tight tracking-tight mb-1.5">
              Gestión de Ventas
            </h1>
            <p className="text-sm text-muted-foreground font-light">
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-16 h-4 rounded bg-muted/60 animate-pulse inline-block" />
                  <span className="text-muted-foreground/50">
                    ventas encontradas
                  </span>
                </span>
              ) : (
                <>
                  <strong className="text-primary font-mono font-semibold">
                    {data?.count ?? 0}
                  </strong>{" "}
                  ventas encontradas
                </>
              )}
            </p>
          </div>

          {/* Botones de acción del header */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => refetch()}
              className="inline-flex justify-center items-center gap-2 px-5 py-2.5 rounded-xl bg-card border border-border text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all shadow-sm"
            >
              <RefreshCw size={16} /> Refrescar
            </button>

            {/* Botón Exportar Excel (solo para roles que pueden verlo) */}
            <div className="relative">
              <button
                onClick={() => setMostrarExport(!mostrarExport)}
                className="inline-flex justify-center items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-all shadow-sm"
              >
                <FileDown size={16} /> Exportar Excel
              </button>

              {/* Panel de configuración de fechas para exportar */}
              {mostrarExport && (
                <>
                  {/* Overlay para cerrar al hacer click fuera */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMostrarExport(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 z-20 w-72 bg-card border border-border rounded-2xl shadow-xl p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-3 font-semibold">
                      Rango de Fechas de Venta
                    </p>
                    <div className="space-y-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] text-muted-foreground font-medium">
                          Desde
                        </label>
                        <input
                          type="date"
                          value={fechaInicio}
                          onChange={(e) => setFechaInicio(e.target.value)}
                          className="h-10 px-3 rounded-xl bg-background border border-border text-sm text-foreground outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] text-muted-foreground font-medium">
                          Hasta
                        </label>
                        <input
                          type="date"
                          value={fechaFin}
                          onChange={(e) => setFechaFin(e.target.value)}
                          className="h-10 px-3 rounded-xl bg-background border border-border text-sm text-foreground outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
                        Si no seleccionas fechas, se exportarán{" "}
                        <strong>todas las ventas</strong>.
                      </p>
                      <button
                        onClick={handleExportar}
                        disabled={exportando}
                        className="w-full h-10 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                      >
                        {exportando ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />{" "}
                            Generando…
                          </>
                        ) : (
                          <>
                            <FileDown size={14} /> Descargar Excel
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
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
            active={!!filtros._pendientes}
            colorClass="text-amber-500"
            bgClass="bg-amber-500/10"
            onClick={() =>
              setFiltros((f) => {
                if (f._pendientes) {
                  const { _pendientes, ...rest } = f;
                  return rest;
                }
                const { id_estado_sot, solicitud_correccion, ...rest } = f;
                return { ...rest, _pendientes: true };
              })
            }
          />
          {idEjecucion && (
            <FilterChip
              label="En Ejecución"
              active={filtros.id_estado_sot === String(idEjecucion)}
              colorClass="text-blue-500"
              bgClass="bg-blue-500/10"
              onClick={() =>
                setFiltros((f) => {
                  const { _pendientes, ...rest } = f;
                  return {
                    ...rest,
                    id_estado_sot:
                      f.id_estado_sot === String(idEjecucion)
                        ? undefined
                        : String(idEjecucion),
                  };
                })
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
                setFiltros((f) => {
                  const { _pendientes, ...rest } = f;
                  return {
                    ...rest,
                    id_estado_sot:
                      f.id_estado_sot === String(idAtendido)
                        ? undefined
                        : String(idAtendido),
                  };
                })
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
                setFiltros((f) => {
                  const { _pendientes, ...rest } = f;
                  return {
                    ...rest,
                    id_estado_sot:
                      f.id_estado_sot === String(idRechazado)
                        ? undefined
                        : String(idRechazado),
                  };
                })
              }
            />
          )}
          <FilterChip
            label="En corrección"
            active={filtros.solicitud_correccion === true}
            colorClass="text-orange-500"
            bgClass="bg-orange-500/10"
            onClick={() =>
              setFiltros((f) => {
                if (f.solicitud_correccion === true) {
                  const { solicitud_correccion, ...rest } = f;
                  return rest;
                }
                const { id_estado_sot, _pendientes, ...rest } = f;
                return { ...rest, solicitud_correccion: true };
              })
            }
          />
        </div>

        {/* ── BÚSQUEDA Y FILTROS AVANZADOS ── */}
        <div className="flex flex-col gap-3 bg-card border border-border p-3 rounded-2xl shadow-sm">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex-1 w-full relative flex items-center">
              <Search
                size={16}
                className="absolute left-4 text-muted-foreground pointer-events-none"
              />
              <input
                type="text"
                placeholder="Buscar por cliente, DNI, SOT, SEC, asesor…"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full h-11 bg-background border border-border rounded-xl pl-11 pr-10 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all"
              />
              {busqueda && (
                <button
                  type="button"
                  onClick={() => setBusqueda("")}
                  className="absolute right-3.5 text-muted-foreground/50 hover:text-foreground transition-colors"
                  aria-label="Limpiar búsqueda"
                >
                  <X size={14} />
                </button>
              )}
            </div>

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
                <Filter size={14} /> Filtros
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
                    filtros._pendientes
                      ? "null"
                      : filtros.id_estado_sot
                        ? String(filtros.id_estado_sot)
                        : "todos"
                  }
                  onChange={(v) => {
                    if (v === "todos")
                      setFiltros((f) => {
                        const { id_estado_sot, _pendientes, ...rest } = f;
                        return rest;
                      });
                    else if (v === "null")
                      setFiltros((f) => {
                        const { id_estado_sot, solicitud_correccion, ...rest } =
                          f;
                        return { ...rest, _pendientes: true };
                      });
                    else
                      setFiltros((f) => {
                        const { _pendientes, ...rest } = f;
                        return { ...rest, id_estado_sot: v };
                      });
                  }}
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
                      {p.nombre_paquete}
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

      {ventaSeleccionada && !soloLectura && (
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
