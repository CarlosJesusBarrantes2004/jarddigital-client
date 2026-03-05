import { useState } from "react";
import {
  ShoppingBag,
  CheckCircle2,
  Zap,
  XCircle,
  Clock,
  Plus,
  Search,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

import {
  useVentas,
  useEstadisticasAsesor,
  useEstadosSOT,
} from "../hooks/useSales";
import type { Venta, VentaFiltros } from "../types/sales.types";
import { DataTable } from "../components/VentasTable";
import { buildColumnsAsesor } from "../components/VentasTable/ColumnsAsesor";
import { VentaFormAsesor } from "../components/VentaFormAsesor";

interface StatProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  colorClass: string; // Ej: "text-primary" o "text-amber-500" (solo para el icono y valor)
  isLoading?: boolean;
  onClick?: () => void;
  highlight?: boolean; // Para destacar suavemente (ej. correcciones)
}

function StatCard({
  icon,
  label,
  value,
  colorClass,
  isLoading,
  onClick,
  highlight,
}: StatProps) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "group flex flex-col sm:flex-row items-start sm:items-center gap-3.5 p-4 rounded-2xl w-full text-left transition-all duration-500 ease-out",
        onClick
          ? "cursor-pointer hover:bg-card/80 hover:shadow-lg hover:-translate-y-0.5"
          : "cursor-default",
        // Fondo base muy sutil
        "bg-card/40 border border-border/50",
        // Si está destacado (highlight), le damos un brillo muuuuy tenue del color primario/alerta
        highlight &&
          "bg-primary/5 border-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.05)]",
      )}
    >
      <div
        className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-500 ease-out group-hover:scale-110",
          // El icono lleva el color semántico, pero el fondo es un cristal oscuro genérico
          "bg-background/80 border border-white/5 shadow-inner",
          colorClass,
        )}
      >
        {icon}
      </div>
      <div className="flex flex-col">
        <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground/70 mb-0.5">
          {label}
        </p>
        {isLoading ? (
          <div className="w-12 h-6 rounded bg-muted/50 animate-pulse mt-1" />
        ) : (
          <p
            className={cn(
              "font-serif text-2xl font-semibold leading-none tracking-tight transition-colors duration-300",
              // Si tiene valor > 0, toma el color semántico, si no, se queda gris/blanco
              value > 0 ? colorClass : "text-foreground/80",
            )}
          >
            {value}
          </p>
        )}
      </div>
    </button>
  );
}

export function VentasAsesorPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [ventaParaReingresar, setVentaParaReingresar] = useState<Venta | null>(
    null,
  );
  const [filtros, setFiltros] = useState<VentaFiltros>({});
  const [busqueda, setBusqueda] = useState("");

  const { data, isLoading, refetch } = useVentas(filtros);
  const { stats, isLoading: loadingStats } = useEstadisticasAsesor();
  const { data: estadosSOT = [] } = useEstadosSOT();

  const ventas = data?.results ?? [];

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    setFiltros((f) => ({ ...f, search: busqueda }));
  };

  const handleReingresar = (venta: Venta) => {
    setVentaParaReingresar(venta);
    setFormOpen(true);
  };

  const handleCerrarForm = () => {
    setFormOpen(false);
    setVentaParaReingresar(null);
  };

  const handleVerVenta = (idVenta: number) => {
    const venta = ventas.find((v) => v.id === idVenta);
    if (venta?.solicitud_correccion) handleReingresar(venta);
  };

  const columns = buildColumnsAsesor(estadosSOT, handleReingresar);

  console.log(ventaParaReingresar);

  return (
    <div className="font-sans min-h-screen bg-background text-foreground transition-colors duration-300">
      <div className="max-w-[1300px] mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6 lg:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* ── HEADER ── */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] tracking-widest uppercase text-primary mb-1.5 font-semibold">
              Dashboard
            </p>
            <h1 className="font-serif text-3xl md:text-4xl font-bold leading-tight tracking-tight mb-1.5">
              Mis Ventas
            </h1>
            <p className="text-sm text-muted-foreground font-light">
              Gestiona y registra tus ventas de servicios Claro.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setVentaParaReingresar(null);
                setFormOpen(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-[0_4px_20px_rgba(var(--primary),0.35)] hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(var(--primary),0.45)] active:translate-y-0"
            >
              <Plus size={16} /> Nueva Venta
            </button>
          </div>
        </div>

        {/* ── ALERTA CORRECCIONES ── */}
        {stats && stats.en_correccion > 0 && (
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-orange-500/10 border border-orange-500/30 animate-in slide-in-from-top-2">
            <AlertTriangle className="text-orange-500 shrink-0" size={20} />
            <div className="flex-1">
              <p className="text-sm font-bold text-orange-500 dark:text-orange-400 mb-0.5">
                {stats.en_correccion} venta
                {stats.en_correccion > 1 ? "s requieren" : " requiere"}{" "}
                corrección
              </p>
              <p className="text-xs text-orange-600/80 dark:text-orange-400/80">
                El backoffice ha solicitado que corrijas los datos antes de
                hacer reingreso.
              </p>
            </div>
            <button
              onClick={() =>
                setFiltros((f) => ({ ...f, solicitud_correccion: true }))
              }
              className="px-4 py-1.5 rounded-lg bg-orange-500/20 border border-orange-500/40 text-orange-600 dark:text-orange-400 text-xs font-bold hover:bg-orange-500/30 transition-colors whitespace-nowrap"
            >
              Ver todas
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            icon={<ShoppingBag size={16} strokeWidth={1.5} />}
            label="Total"
            value={stats?.total || 0}
            colorClass="text-foreground"
            isLoading={loadingStats}
            onClick={() => setFiltros({})}
          />
          <StatCard
            icon={<Zap size={16} strokeWidth={1.5} />}
            label="En Ejecución"
            value={stats?.en_ejecucion || 0}
            colorClass="text-primary" // Celeste Jard (Tu color principal)
            isLoading={loadingStats}
          />
          <StatCard
            icon={<CheckCircle2 size={16} strokeWidth={1.5} />}
            label="Atendidas"
            value={stats?.atendidas || 0}
            colorClass="text-emerald-400" // Verde suave y elegante
            isLoading={loadingStats}
          />
          <StatCard
            icon={<XCircle size={16} strokeWidth={1.5} />}
            label="Rechazadas"
            value={stats?.rechazadas || 0}
            colorClass="text-red-400/90" // Rojo desaturado, no fosforescente
            isLoading={loadingStats}
          />
          <StatCard
            icon={<Clock size={16} strokeWidth={1.5} />}
            label="Pendientes"
            value={stats?.pendientes || 0}
            colorClass="text-[#C9975A]" // El Dorado Cobrizo original de Claude
            isLoading={loadingStats}
          />
          <StatCard
            icon={<AlertTriangle size={16} strokeWidth={1.5} />}
            label="Correcciones"
            value={stats?.en_correccion || 0}
            colorClass="text-orange-400/90"
            isLoading={loadingStats}
            highlight={(stats?.en_correccion || 0) > 0}
            onClick={() =>
              setFiltros((f) => ({ ...f, solicitud_correccion: true }))
            }
          />
        </div>

        {/* ── BÚSQUEDA ── */}
        <div className="flex flex-col sm:flex-row items-center gap-3 bg-card border border-border p-3 rounded-2xl shadow-sm">
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
              placeholder="Buscar por nombre, DNI, código SOT/SEC…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full h-11 bg-background border border-border rounded-xl pl-11 pr-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all"
            />
            <button
              type="submit"
              className="hidden sm:block h-11 px-6 rounded-xl bg-muted border border-border text-xs font-semibold hover:bg-muted/80 transition-colors"
            >
              Buscar
            </button>
          </form>
          <button
            onClick={() => refetch()}
            title="Refrescar"
            className="w-full sm:w-11 h-11 flex items-center justify-center rounded-xl bg-background border border-border text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <RefreshCw size={16} />{" "}
            <span className="sm:hidden ml-2 text-sm font-medium">
              Refrescar
            </span>
          </button>
          {(filtros.search || filtros.solicitud_correccion) && (
            <button
              onClick={() => {
                setFiltros({});
                setBusqueda("");
              }}
              className="w-full sm:w-auto h-11 px-4 rounded-xl bg-transparent border border-border text-xs font-medium text-muted-foreground hover:bg-muted transition-colors whitespace-nowrap"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {/* ── TABLA ── */}
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <DataTable
            columns={columns}
            data={ventas}
            isLoading={isLoading}
            emptyMessage="No tienes ventas registradas. ¡Crea tu primera venta!"
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
                className="px-4 py-2 rounded-lg bg-card border border-border disabled:opacity-50 hover:bg-muted transition-colors"
              >
                Anterior
              </button>
              <button
                disabled={!data.next}
                className="px-4 py-2 rounded-lg bg-card border border-border disabled:opacity-50 hover:bg-muted transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL FORM ASESOR ── */}
      {formOpen && (
        <VentaFormAsesor
          open={formOpen}
          onClose={handleCerrarForm}
          ventaOrigen={ventaParaReingresar}
        />
      )}
    </div>
  );
}
