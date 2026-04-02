/**
 * features/sales/pages/AsesorPage.tsx
 */
import { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Search,
  X,
  Calendar,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

import {
  useVentas,
  useEstadosSOT,
  useEstadisticasAsesor,
  useDeleteVentaAsesor,
} from "../hooks/useSales";
import type { Venta, VentaFiltros, EstadoSOT } from "../types/sales.types";
import { DataTable } from "../components/VentasTable";
import { buildColumnsAsesor } from "../components/VentasTable/columnsAsesor";
import { VentaFormAsesor } from "../components/VentaFormAsesor";
import { PaginationControls } from "../components/PaginationControls";
import { VentaDetalleModal } from "../components/VentaDetalleModal";

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

// Construye los filtros de API a partir del estado de UI (sin page ni page_size)
function useFiltrosAsesor(estadosSOT: EstadoSOT[]) {
  const [tab, setTab] = useState<TabEstado>("todos");
  const [search, setSearch] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  const filtros: VentaFiltros = useMemo(() => {
    const base: VentaFiltros = {
      ...(search ? { search } : {}),
      ...(fechaDesde ? { fecha_inicio: fechaDesde } : {}),
      ...(fechaHasta ? { fecha_fin: fechaHasta } : {}),
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
  }, [tab, search, fechaDesde, fechaHasta, estadosSOT]);

  const limpiarFechas = () => {
    setFechaDesde("");
    setFechaHasta("");
  };

  return {
    tab,
    setTab,
    search,
    setSearch,
    fechaDesde,
    setFechaDesde,
    fechaHasta,
    setFechaHasta,
    limpiarFechas,
    filtros,
  };
}

interface ConfirmDeleteModalProps {
  venta: Venta | null;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}

function ConfirmDeleteModal({
  venta,
  onConfirm,
  onCancel,
  isPending,
}: ConfirmDeleteModalProps) {
  if (!venta) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[2000] bg-black/40 animate-in fade-in duration-200"
        onClick={onCancel}
      />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[2001] w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 fade-in duration-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
            <Trash2 size={18} className="text-destructive" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm leading-snug">
              ¿Eliminar esta venta?
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Esta acción no se puede deshacer
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-muted/50 border border-border mb-5">
          <p className="text-sm font-medium text-foreground">
            {venta.cliente_nombre}
          </p>
          <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
            {venta.cliente_numero_doc} · #{venta.id}
          </p>
          {venta.solicitud_correccion && (
            <div className="flex items-center gap-1.5 mt-2">
              <AlertTriangle size={11} className="text-orange-500" />
              <span className="text-[10px] text-orange-500 font-mono uppercase tracking-widest">
                En corrección
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 h-10 rounded-xl"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1 h-10 rounded-xl bg-destructive text-white hover:bg-destructive/90"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 size={14} className="animate-spin mr-1.5" />
            ) : (
              <Trash2 size={14} className="mr-1.5" />
            )}
            Eliminar
          </Button>
        </div>
      </div>
    </>
  );
}

function StatCard({
  label,
  value,
  color,
  onClick,
  active,
}: {
  label: string;
  value: number;
  color: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col gap-1 p-4 rounded-2xl border text-left transition-all duration-200",
        active
          ? "border-primary/40 bg-primary/5 shadow-sm"
          : "border-border bg-card hover:bg-muted/50",
      )}
    >
      <span className={cn("text-2xl font-serif font-bold", color)}>
        {value}
      </span>
      <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
    </button>
  );
}

export function AsesorPage() {
  const { data: estadosSOTData = [] } = useEstadosSOT();

  const {
    tab,
    setTab,
    search,
    setSearch,
    fechaDesde,
    setFechaDesde,
    fechaHasta,
    setFechaHasta,
    limpiarFechas,
    filtros,
  } = useFiltrosAsesor(estadosSOTData);

  // ── Paginación ──────────────────────────────────────────────
  const [page, setPage] = useState(1);

  const [ventaDetalle, setVentaDetalle] = useState<Venta | null>(null);

  // Cuando cambia cualquier filtro, volver a la primera página
  useEffect(() => {
    setPage(1);
  }, [filtros]);

  // Filtros finales: agrega page y page_size para activar paginación en el backend
  const filtrosConPagina: VentaFiltros = useMemo(
    () => ({ ...filtros, page, page_size: PAGE_SIZE }),
    [filtros, page],
  );

  const { data, isLoading, isFetching, refetch } = useVentas(filtrosConPagina);
  const ventas = data?.results ?? [];

  // Stats: usan filtros sin page para obtener counts reales
  const { stats } = useEstadisticasAsesor({
    fecha_inicio: fechaDesde,
    fecha_fin: fechaHasta,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [ventaSeleccionada, setVentaSeleccionada] = useState<Venta | null>(
    null,
  );
  const [ventaParaEliminar, setVentaParaEliminar] = useState<Venta | null>(
    null,
  );

  const { mutateAsync: eliminarVenta, isPending: eliminando } =
    useDeleteVentaAsesor();

  const handleNuevaVenta = () => {
    setVentaSeleccionada(null);
    setFormOpen(true);
  };

  const handleEditar = (v: Venta) => {
    setVentaSeleccionada(v);
    setFormOpen(true);
  };

  const handleReingresar = (v: Venta) => {
    setVentaSeleccionada(v);
    setFormOpen(true);
  };

  const handleEliminar = (v: Venta) => {
    setVentaParaEliminar(v);
  };

  const confirmarEliminar = async () => {
    if (!ventaParaEliminar) return;
    try {
      await eliminarVenta(ventaParaEliminar.id);
      toast.success(
        `Venta de ${ventaParaEliminar.cliente_nombre} eliminada correctamente`,
      );
      setVentaParaEliminar(null);
    } catch {
      toast.error("No se pudo eliminar la venta. Inténtalo de nuevo.");
    }
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setVentaSeleccionada(null);
  };

  const columns = useMemo(
    () =>
      buildColumnsAsesor(
        estadosSOTData,
        handleEditar,
        handleReingresar,
        handleEliminar,
        setVentaDetalle,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [estadosSOTData],
  );

  const tieneFechas = !!fechaDesde || !!fechaHasta;
  const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 0;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-[1400px] mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground tracking-tight">
            Mis Ventas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona y da seguimiento a tus ventas registradas
          </p>
        </div>
        <Button
          onClick={handleNuevaVenta}
          className="h-11 px-5 rounded-xl gap-2 bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Nueva Venta</span>
        </Button>
      </div>

      {/* ── Estadísticas ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          label="Total"
          value={stats.total}
          color="text-foreground"
          onClick={() => setTab("todos")}
          active={tab === "todos"}
        />
        <StatCard
          label="Pendientes"
          value={stats.pendientes}
          color="text-amber-500"
          onClick={() => setTab("pendientes")}
          active={tab === "pendientes"}
        />
        <StatCard
          label="Ejecución"
          value={stats.en_ejecucion}
          color="text-blue-500"
          onClick={() => setTab("ejecucion")}
          active={tab === "ejecucion"}
        />
        <StatCard
          label="Atendidas"
          value={stats.atendidas}
          color="text-emerald-500"
          onClick={() => setTab("atendidas")}
          active={tab === "atendidas"}
        />
        <StatCard
          label="Rechazadas"
          value={stats.rechazadas}
          color="text-destructive"
          onClick={() => setTab("rechazadas")}
          active={tab === "rechazadas"}
        />
        <StatCard
          label="Corrección"
          value={stats.en_correccion}
          color="text-orange-500"
          onClick={() => setTab("correccion")}
          active={tab === "correccion"}
        />
      </div>

      {/* ── Filtros ── */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search
              size={13}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <input
              type="text"
              placeholder="Cliente, DNI, SOT, SEC…"
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
              onClick={limpiarFechas}
              className="h-10 px-3 rounded-xl border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Limpiar fechas"
            >
              <X size={13} />
            </button>
          )}

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
            ? "No tienes ventas pendientes"
            : tab === "correccion"
              ? "No tienes ventas en corrección"
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

      {/* ── Form Asesor ── */}
      <VentaFormAsesor
        open={formOpen}
        onClose={handleCloseForm}
        ventaOrigen={ventaSeleccionada}
      />

      {/* ── Modal confirmación borrado ── */}
      <ConfirmDeleteModal
        venta={ventaParaEliminar}
        onConfirm={confirmarEliminar}
        onCancel={() => setVentaParaEliminar(null)}
        isPending={eliminando}
      />

      <VentaDetalleModal
        open={!!ventaDetalle}
        onClose={() => setVentaDetalle(null)}
        venta={ventaDetalle!}
      />
    </div>
  );
}
