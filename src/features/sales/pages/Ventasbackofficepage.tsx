/**
 * features/sales/pages/BackofficePage.tsx
 */
import { useState, useMemo, useRef, useEffect } from "react";
import {
  Search,
  X,
  Calendar,
  RefreshCw,
  Download,
  Loader2,
  ChevronDown,
  FileSpreadsheet,
  Mic,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

import { useVentas, useEstadosSOT, useEstadosAudio } from "../hooks/useSales";
import { salesService } from "../services/sales.service";
import type { Venta, VentaFiltros, EstadoSOT } from "../types/sales.types";
import { DataTable } from "../components/VentasTable";
import { buildColumnsBackoffice } from "../components/VentasTable/columnsBackoffice";
import { VentaFormBackoffice } from "../components/VentaFormBackoffice";
import { PaginationControls } from "../components/PaginationControls";

const PAGE_SIZE = 5;

type TabEstado =
  | "todos"
  | "pendientes"
  | "ejecucion"
  | "atendidas"
  | "rechazadas"
  | "correccion";

const TABS: { key: TabEstado; label: string; colorActivo: string }[] = [
  {
    key: "todos",
    label: "Todas",
    colorActivo: "bg-foreground text-background border-foreground",
  },
  {
    key: "pendientes",
    label: "Pendientes",
    colorActivo:
      "bg-amber-500/15 text-amber-600 border-amber-500/40 dark:text-amber-400",
  },
  {
    key: "ejecucion",
    label: "Ejecución",
    colorActivo:
      "bg-blue-500/15 text-blue-600 border-blue-500/40 dark:text-blue-400",
  },
  {
    key: "atendidas",
    label: "Atendidas",
    colorActivo:
      "bg-emerald-500/15 text-emerald-600 border-emerald-500/40 dark:text-emerald-400",
  },
  {
    key: "rechazadas",
    label: "Rechazadas",
    colorActivo: "bg-destructive/15 text-destructive border-destructive/40",
  },
  {
    key: "correccion",
    label: "Corrección",
    colorActivo:
      "bg-orange-500/15 text-orange-600 border-orange-500/40 dark:text-orange-400",
  },
];

type EstadoExcel = "todas" | "ATENDIDO" | "EJECUCION" | "RECHAZADO";

const OPCIONES_EXCEL: { key: EstadoExcel; label: string; desc: string }[] = [
  {
    key: "todas",
    label: "Todas las hojas",
    desc: "Genera Atendidas + Ejecución + Rechazadas",
  },
  {
    key: "ATENDIDO",
    label: "Solo Atendidas",
    desc: "Una hoja solo con ventas ATENDIDAS",
  },
  {
    key: "EJECUCION",
    label: "Solo Ejecución",
    desc: "Una hoja solo con ventas en EJECUCIÓN",
  },
  {
    key: "RECHAZADO",
    label: "Solo Rechazadas",
    desc: "Una hoja solo con ventas RECHAZADAS",
  },
];

function ExcelPanel({ onClose }: { onClose: () => void }) {
  const [estadoExcel, setEstadoExcel] = useState<EstadoExcel>("todas");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [exportando, setExportando] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const handleExportar = async () => {
    setExportando(true);
    try {
      await salesService.exportarExcel(
        fechaDesde || undefined,
        fechaHasta || undefined,
        estadoExcel === "todas" ? undefined : estadoExcel,
      );
      toast.success("Excel generado correctamente");
      onClose();
    } catch {
      toast.error("Error al generar el Excel. Inténtalo de nuevo.");
    } finally {
      setExportando(false);
    }
  };

  return (
    <div
      ref={ref}
      className="absolute right-0 top-12 z-50 w-80 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
    >
      <div className="px-5 py-4 border-b border-border bg-muted/30 flex items-center gap-3">
        <FileSpreadsheet size={16} className="text-emerald-500 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-foreground leading-none">
            Exportar Excel
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Configura qué datos descargar
          </p>
        </div>
      </div>

      <div className="p-5 flex flex-col gap-5">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-bold mb-2">
            Incluir estados
          </p>
          <div className="flex flex-col gap-1.5">
            {OPCIONES_EXCEL.map((op) => (
              <button
                key={op.key}
                onClick={() => setEstadoExcel(op.key)}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-xl text-left border transition-all duration-150",
                  estadoExcel === op.key
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                    : "bg-background border-border hover:bg-muted text-foreground",
                )}
              >
                <div
                  className={cn(
                    "w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center",
                    estadoExcel === op.key
                      ? "border-emerald-500 bg-emerald-500"
                      : "border-muted-foreground/40",
                  )}
                >
                  {estadoExcel === op.key && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
                <div>
                  <p className="text-[13px] font-medium leading-none mb-0.5">
                    {op.label}
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    {op.desc}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-bold mb-2">
            Rango de fechas{" "}
            <span className="normal-case font-normal">(opcional)</span>
          </p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 h-10 px-3 rounded-xl border border-border bg-background">
              <Calendar size={12} className="text-muted-foreground shrink-0" />
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="flex-1 text-sm bg-transparent outline-none text-foreground cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-2 h-10 px-3 rounded-xl border border-border bg-background">
              <Calendar size={12} className="text-muted-foreground shrink-0" />
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="flex-1 text-sm bg-transparent outline-none text-foreground cursor-pointer"
              />
            </div>
            {(fechaDesde || fechaHasta) && (
              <button
                onClick={() => {
                  setFechaDesde("");
                  setFechaHasta("");
                }}
                className="text-[11px] text-muted-foreground hover:text-destructive text-left transition-colors"
              >
                ✕ Limpiar fechas
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-1 border-t border-border">
          <Button
            variant="outline"
            className="flex-1 h-10 rounded-xl text-sm"
            onClick={onClose}
            disabled={exportando}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1 h-10 rounded-xl text-sm bg-emerald-500 hover:bg-emerald-600 text-white font-semibold shadow-sm shadow-emerald-500/20 gap-2"
            onClick={handleExportar}
            disabled={exportando}
          >
            {exportando ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            )}
            {exportando ? "Generando…" : "Descargar"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Construye los filtros de API (sin page ni page_size)
function useFiltrosBackoffice(estadosSOT: EstadoSOT[]) {
  const [tab, setTab] = useState<TabEstado>("todos");
  const [search, setSearch] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [filtroEstadoAudio, setFiltroEstadoAudio] = useState<number | "">("");
  const [ordenFecha, setOrdenFecha] = useState<"asc" | "desc" | null>("desc");

  const handleToggleOrdenFecha = () => {
    setOrdenFecha((prev) => {
      if (prev === "desc") return "asc";
      if (prev === "asc") return null;
      return "desc";
    });
  };

  const filtros: VentaFiltros = useMemo(() => {
    const base: VentaFiltros = {
      ...(search ? { search } : {}),
      ...(fechaDesde ? { fecha_inicio: fechaDesde } : {}),
      ...(fechaHasta ? { fecha_fin: fechaHasta } : {}),
      ...(filtroEstadoAudio !== ""
        ? { id_estado_audios: filtroEstadoAudio }
        : {}),
      ...(ordenFecha
        ? { ordering: ordenFecha === "asc" ? "fecha_venta" : "-fecha_venta" }
        : {}),
    };

    switch (tab) {
      case "pendientes":
        return { ...base, id_estado_sot__isnull: true };
      case "correccion":
        return { ...base, solicitud_correccion: true };
      case "ejecucion": {
        const e = estadosSOT.find(
          (s) => s.codigo.toUpperCase() === "EJECUCION",
        );
        return e ? { ...base, id_estado_sot: e.id } : base;
      }
      case "atendidas": {
        const e = estadosSOT.find((s) => s.codigo.toUpperCase() === "ATENDIDO");
        return e ? { ...base, id_estado_sot: e.id } : base;
      }
      case "rechazadas": {
        const e = estadosSOT.find(
          (s) => s.codigo.toUpperCase() === "RECHAZADO",
        );
        return e ? { ...base, id_estado_sot: e.id } : base;
      }
      default:
        return base;
    }
  }, [
    tab,
    search,
    fechaDesde,
    fechaHasta,
    filtroEstadoAudio,
    ordenFecha,
    estadosSOT,
  ]);

  return {
    tab,
    setTab,
    search,
    setSearch,
    fechaDesde,
    setFechaDesde,
    fechaHasta,
    setFechaHasta,
    filtroEstadoAudio,
    setFiltroEstadoAudio,
    ordenFecha,
    handleToggleOrdenFecha,
    filtros,
  };
}

interface BackofficePageProps {
  soloLectura?: boolean;
}

export function BackofficePage({ soloLectura = false }: BackofficePageProps) {
  const { data: estadosSOTData = [] } = useEstadosSOT();
  const { data: estadosAudio = [] } = useEstadosAudio();

  const {
    tab,
    setTab,
    search,
    setSearch,
    fechaDesde,
    setFechaDesde,
    fechaHasta,
    setFechaHasta,
    filtroEstadoAudio,
    setFiltroEstadoAudio,
    ordenFecha,
    handleToggleOrdenFecha,
    filtros,
  } = useFiltrosBackoffice(estadosSOTData);

  // ── Paginación ──────────────────────────────────────────────
  const [page, setPage] = useState(1);

  // Cuando cambia cualquier filtro, volver a la primera página
  useEffect(() => {
    setPage(1);
  }, [filtros]);

  // Filtros finales: agrega page y page_size
  const filtrosConPagina: VentaFiltros = useMemo(
    () => ({ ...filtros, page, page_size: PAGE_SIZE }),
    [filtros, page],
  );

  const { data, isLoading, isFetching, refetch } = useVentas(filtrosConPagina);
  const ventas = data?.results ?? [];

  const [ventaSeleccionada, setVentaSeleccionada] = useState<Venta | null>(
    null,
  );
  const [excelOpen, setExcelOpen] = useState(false);

  const handleGestionar = (v: Venta) => setVentaSeleccionada(v);
  const handleCerrarForm = () => setVentaSeleccionada(null);

  const columns = useMemo(
    () =>
      buildColumnsBackoffice(
        estadosSOTData,
        estadosAudio,
        soloLectura ? null : handleGestionar,
        ordenFecha,
        handleToggleOrdenFecha,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [estadosSOTData, estadosAudio, soloLectura, ordenFecha],
  );

  const tieneFechas = !!fechaDesde || !!fechaHasta;
  const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 0;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-[1400px] mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground tracking-tight">
            Gestión de Ventas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Revisa, procesa y controla el estado de todas las ventas
          </p>
        </div>

        <div className="relative">
          <Button
            variant="outline"
            onClick={() => setExcelOpen((v) => !v)}
            className="h-11 px-5 rounded-xl gap-2 font-medium"
          >
            <Download size={15} />
            <span className="hidden sm:inline">Exportar Excel</span>
            <ChevronDown
              size={13}
              className={cn(
                "transition-transform duration-200",
                excelOpen && "rotate-180",
              )}
            />
          </Button>

          {excelOpen && <ExcelPanel onClose={() => setExcelOpen(false)} />}
        </div>
      </div>

      {/* ── Filtros ── */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <Search
              size={13}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <input
              type="text"
              placeholder="Cliente, DNI, asesor, SOT, SEC…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-8 rounded-xl bg-background border border-border text-sm font-sans outline-none transition-all focus:ring-4 focus:ring-primary/10 focus:border-primary"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 h-10 px-3 rounded-xl border border-border bg-background">
            <Calendar size={12} className="text-muted-foreground shrink-0" />
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              title="Desde"
              className="text-sm text-foreground bg-transparent outline-none w-[7.5rem] cursor-pointer"
            />
          </div>
          <span className="text-xs text-muted-foreground select-none">—</span>
          <div className="flex items-center gap-1.5 h-10 px-3 rounded-xl border border-border bg-background">
            <Calendar size={12} className="text-muted-foreground shrink-0" />
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              title="Hasta"
              className="text-sm text-foreground bg-transparent outline-none w-[7.5rem] cursor-pointer"
            />
          </div>
          {tieneFechas && (
            <button
              onClick={() => {
                setFechaDesde("");
                setFechaHasta("");
              }}
              className="h-10 px-3 rounded-xl border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Limpiar fechas"
            >
              <X size={13} />
            </button>
          )}

          <div className="relative flex items-center gap-1.5 h-10 px-3 rounded-xl border border-border bg-background min-w-[160px]">
            <Mic size={12} className="text-muted-foreground shrink-0" />
            <select
              value={filtroEstadoAudio}
              onChange={(e) =>
                setFiltroEstadoAudio(
                  e.target.value === "" ? "" : Number(e.target.value),
                )
              }
              className="w-full text-sm text-foreground bg-transparent outline-none cursor-pointer appearance-none pr-5"
            >
              <option value="">Todos los audios</option>
              {estadosAudio.map((ea) => (
                <option key={ea.id} value={ea.id}>
                  {ea.nombre}
                </option>
              ))}
            </select>
            <ChevronDown
              size={12}
              className="absolute right-3 text-muted-foreground pointer-events-none"
            />
            {filtroEstadoAudio !== "" && (
              <button
                onClick={() => setFiltroEstadoAudio("")}
                className="absolute right-7 text-muted-foreground hover:text-foreground"
              >
                <X size={11} />
              </button>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {data?.count !== undefined && (
              <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                {data.count} resultado{data.count !== 1 ? "s" : ""}
              </span>
            )}
            <button
              onClick={() => refetch()}
              className={cn(
                "h-10 w-10 rounded-xl border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors",
                isFetching && "animate-spin text-primary",
              )}
              title="Refrescar"
            >
              <RefreshCw size={13} />
            </button>
          </div>
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "h-8 px-3.5 rounded-full text-[11px] font-mono font-semibold uppercase tracking-widest border transition-all duration-150 whitespace-nowrap",
                tab === t.key
                  ? t.colorActivo + " shadow-sm"
                  : "bg-background text-muted-foreground border-border hover:border-primary/30 hover:text-foreground",
              )}
            >
              {t.label}
              {t.key !== "todos" &&
                tab === t.key &&
                data?.count !== undefined && (
                  <span className="ml-1.5 opacity-70">({data.count})</span>
                )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tabla ── */}
      <DataTable
        columns={columns}
        data={ventas}
        isLoading={isLoading}
        emptyMessage={
          tab === "pendientes"
            ? "No hay ventas pendientes de gestión"
            : tab === "correccion"
              ? "No hay ventas en corrección"
              : tab === "atendidas"
                ? "No hay ventas atendidas con estos filtros"
                : "No se encontraron ventas con los filtros aplicados"
        }
      />

      {/* ── Paginación ── */}
      {totalPages > 1 && (
        <PaginationControls
          count={data?.count ?? 0}
          page={page}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      )}

      {/* ── Form Backoffice ── */}
      {ventaSeleccionada && (
        <VentaFormBackoffice
          open={!!ventaSeleccionada}
          onClose={handleCerrarForm}
          venta={ventaSeleccionada}
        />
      )}
    </div>
  );
}
