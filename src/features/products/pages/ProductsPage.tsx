import { useState, useMemo, memo } from "react";
import {
  Plus,
  Search,
  RefreshCw,
  Filter,
  X,
  Package,
  Star,
  TrendingUp,
  ToggleLeft,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils"; // <-- Única adición para el diseño
import {
  useProductos,
  useCampanas,
  useDeleteProducto,
  useReactivateProducto,
} from "../hooks/useProductos";
import {
  TIPOS_SOLUCION,
  type Producto,
  type ProductoFiltros,
} from "../types/productos.types";
import { buildColumnsProductos } from "../components/Columns";
import { DataTable } from "@/features/sales";
import { ProductoForm } from "../components/ProductForm";
import { ConfirmDialog } from "../components/Confirmdialog";

// ── StatCard ──────────────────────────────────────────────────────────────────
const StatCard = memo(function StatCard({
  icon,
  label,
  value,
  colorClass,
  bgClass,
  borderClass,
  isLoading,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  isLoading?: boolean;
}) {
  return (
    <div className="group flex items-center gap-3.5 p-4 rounded-2xl bg-card/40 border border-border/50 transition-all duration-300 hover:bg-card/80 hover:shadow-md">
      <div
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-xl border shrink-0 transition-transform duration-500 group-hover:scale-110 shadow-inner",
          bgClass,
          borderClass,
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
              value === 0 || value === "S/ 0.00"
                ? "text-foreground/80"
                : colorClass,
            )}
          >
            {value}
          </p>
        )}
      </div>
    </div>
  );
});

// ── FilterChip ────────────────────────────────────────────────────────────────
const FilterChip = memo(function FilterChip({
  label,
  active,
  activeClass,
  onClick,
}: {
  label: string;
  active?: boolean;
  activeClass?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-3.5 py-1.5 rounded-full text-xs font-medium font-sans transition-all duration-200 border whitespace-nowrap",
        active
          ? cn(activeClass, "shadow-sm")
          : "bg-card border-border text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
});

// ─────────────────────────────────────────────────────────────────────────────

export function ProductosPage() {
  // ── State UI ──
  const [formOpen, setFormOpen] = useState(false);
  const [productoEditar, setProductoEditar] = useState<Producto | null>(null);
  const [productoEliminar, setProductoEliminar] = useState<Producto | null>(
    null,
  );
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  // ── Filtros ──
  const [filtros, setFiltros] = useState<ProductoFiltros>({});
  const [busqueda, setBusqueda] = useState("");
  const [page, setPage] = useState(1);

  // ── Data ──
  const { data, isLoading, refetch } = useProductos({ ...filtros, page });
  const { data: campanas = [], isLoading: loadingCampanas } = useCampanas();
  const { mutateAsync: eliminar, isPending: eliminando } = useDeleteProducto();
  const { mutateAsync: reactivar } = useReactivateProducto();

  const productos: Producto[] = Array.isArray(data)
    ? data
    : (data?.results ?? []);

  // ── Estadísticas calculadas ──
  // ── Estadísticas calculadas ──
  const stats = useMemo(() => {
    if (!data)
      return { total: 0, activos: 0, alto_valor: 0, promedio_comision: "0.00" };

    const items: Producto[] = Array.isArray(data) ? data : (data.results ?? []);
    const total = Array.isArray(data) ? items.length : data.count;
    const activos = items.filter((p) => p.activo).length;
    const alto_valor = items.filter((p) => p.es_alto_valor).length;
    const promedio_comision = items.length
      ? (
          items.reduce((acc, p) => acc + Number(p.comision_base || 0), 0) /
          items.length
        ).toFixed(2)
      : "0.00";

    return { total, activos, alto_valor, promedio_comision };
  }, [data]);

  // ── Handles ──
  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    setFiltros((f) => ({ ...f, search: busqueda }));
    setPage(1);
  };

  const limpiar = () => {
    setFiltros({});
    setBusqueda("");
    setPage(1);
  };

  const handleEditar = (p: Producto) => {
    setProductoEditar(p);
    setFormOpen(true);
  };

  const handleNuevo = () => {
    setProductoEditar(null);
    setFormOpen(true);
  };

  const handleCerrarForm = () => {
    setFormOpen(false);
    setProductoEditar(null);
  };

  const handleConfirmEliminar = async () => {
    if (!productoEliminar) return;
    try {
      await eliminar(productoEliminar.id);
      toast.success(`"${productoEliminar.nombre_plan}" desactivado`);
      setProductoEliminar(null);
    } catch {
      toast.error("Error al desactivar el producto");
    }
  };

  const handleReactivar = async (p: Producto) => {
    try {
      await reactivar(p.id);
      toast.success(`"${p.nombre_plan}" reactivado`);
    } catch {
      toast.error("Error al reactivar el producto");
    }
  };

  const filtrosActivos = Object.entries(filtros).filter(
    ([k, v]) => v !== undefined && v !== "" && v !== null && k !== "search",
  ).length;

  const columns = buildColumnsProductos(
    handleEditar,
    setProductoEliminar,
    handleReactivar,
  );

  // Justo antes del return del componente
  const paginado = !Array.isArray(data) ? data : null;

  return (
    <>
      <div className="font-sans min-h-screen bg-background text-foreground transition-colors duration-300">
        <div className="max-w-[84rem] mx-auto p-6 lg:p-9 flex flex-col gap-7 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* ── HEADER ── */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] tracking-widest uppercase text-primary mb-1.5 font-semibold">
                Catálogo
              </p>
              <h1 className="font-serif text-3xl lg:text-[2rem] font-bold text-foreground leading-tight mb-1.5">
                Productos & Planes
              </h1>
              <p className="text-sm text-muted-foreground font-light">
                Gestiona el catálogo de planes y campañas disponibles
              </p>
            </div>

            <button
              type="button"
              onClick={handleNuevo}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-[0_4px_20px_rgba(var(--primary),0.35)] hover:-translate-y-0.5 active:translate-y-0 shrink-0"
            >
              <Plus size={16} strokeWidth={2.5} /> Nuevo Producto
            </button>
          </div>

          {/* ── STATS ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={<Package size={18} strokeWidth={1.5} />}
              label="Total planes"
              value={isLoading ? 0 : stats.total}
              colorClass="text-primary"
              bgClass="bg-primary/10"
              borderClass="border-primary/20"
              isLoading={isLoading}
            />
            <StatCard
              icon={<ToggleLeft size={18} strokeWidth={1.5} />}
              label="Activos"
              value={isLoading ? 0 : stats.activos}
              colorClass="text-emerald-500"
              bgClass="bg-emerald-500/10"
              borderClass="border-emerald-500/20"
              isLoading={isLoading}
            />
            <StatCard
              icon={<Star size={18} strokeWidth={1.5} />}
              label="Alto valor"
              value={isLoading ? 0 : stats.alto_valor}
              colorClass="text-[#C9975A]" // Dorado cobrizo
              bgClass="bg-[#C9975A]/10"
              borderClass="border-[#C9975A]/20"
              isLoading={isLoading}
            />
            <StatCard
              icon={<TrendingUp size={18} strokeWidth={1.5} />}
              label="Comisión prom."
              value={isLoading ? "—" : `S/ ${stats.promedio_comision}`}
              colorClass="text-purple-500"
              bgClass="bg-purple-500/10"
              borderClass="border-purple-500/20"
              isLoading={isLoading}
            />
          </div>

          {/* ── CHIPS DE FILTRO RÁPIDO ── */}
          <div className="flex flex-wrap gap-2 items-center">
            <FilterChip
              label="Todos"
              active={Object.keys(filtros).length === 0}
              activeClass="bg-muted text-foreground border-border"
              onClick={limpiar}
            />
            <div className="h-4 w-px bg-border mx-1" />
            <FilterChip
              label="Activos"
              active={filtros.activo === true}
              activeClass="bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
              onClick={() =>
                setFiltros((f) => ({
                  ...f,
                  activo: f.activo === true ? undefined : true,
                }))
              }
            />
            <FilterChip
              label="Inactivos"
              active={filtros.activo === false}
              activeClass="bg-destructive/10 text-destructive border-destructive/30"
              onClick={() =>
                setFiltros((f) => ({
                  ...f,
                  activo: f.activo === false ? undefined : false,
                }))
              }
            />
            <FilterChip
              label="⭐ Alto valor"
              active={filtros.es_alto_valor === true}
              activeClass="bg-[#C9975A]/10 text-[#C9975A] border-[#C9975A]/30"
              onClick={() =>
                setFiltros((f) => ({
                  ...f,
                  es_alto_valor: f.es_alto_valor === true ? undefined : true,
                }))
              }
            />
            <div className="h-4 w-px bg-border mx-1" />
            {TIPOS_SOLUCION.map((tipo) => (
              <FilterChip
                key={tipo}
                label={tipo}
                active={filtros.tipo_solucion === tipo}
                activeClass="bg-primary/10 text-primary border-primary/30"
                onClick={() =>
                  setFiltros((f) => ({
                    ...f,
                    tipo_solucion: f.tipo_solucion === tipo ? undefined : tipo,
                  }))
                }
              />
            ))}
          </div>

          {/* ── BÚSQUEDA + FILTROS AVANZADOS ── */}
          <div className="bg-card/40 border border-border/50 p-4 rounded-2xl shadow-sm flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {/* Barra de búsqueda */}
              <form
                onSubmit={handleBuscar}
                className="flex-1 w-full relative flex items-center gap-2"
              >
                <Search
                  size={16}
                  className="absolute left-4 text-muted-foreground/60 pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="Buscar por nombre de plan, campaña, paquete…"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full h-11 bg-background/50 border border-border/50 rounded-xl pl-11 pr-4 text-sm text-foreground focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-muted-foreground/60"
                />
                <button
                  type="submit"
                  className="hidden sm:block h-11 px-6 rounded-xl bg-card border border-border text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  Buscar
                </button>
              </form>

              {/* Botones de acción */}
              <div className="flex w-full sm:w-auto gap-2">
                <button
                  type="button"
                  onClick={() => setMostrarFiltros(!mostrarFiltros)}
                  className={cn(
                    "flex-1 sm:flex-none h-11 px-5 flex items-center justify-center gap-2 rounded-xl border text-xs font-semibold transition-colors relative",
                    mostrarFiltros
                      ? "bg-primary/10 border-primary/30 text-primary"
                      : "bg-card border-border text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Filter size={14} /> Filtros
                  {filtrosActivos > 0 && (
                    <span className="w-4 h-4 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[9px] font-bold font-mono">
                      {filtrosActivos}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => refetch()}
                  title="Refrescar"
                  className="w-11 h-11 flex items-center justify-center rounded-xl bg-card border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
                >
                  <RefreshCw size={14} />
                </button>

                {(filtrosActivos > 0 || busqueda) && (
                  <button
                    type="button"
                    onClick={limpiar}
                    className="flex-1 sm:flex-none h-11 px-4 rounded-xl bg-transparent border border-border text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex items-center justify-center gap-2"
                  >
                    <X size={12} />{" "}
                    <span className="hidden sm:inline">Limpiar</span>
                  </button>
                )}
              </div>
            </div>

            {/* Panel de filtros avanzados */}
            {mostrarFiltros && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border/50 animate-in fade-in slide-in-from-top-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono font-semibold uppercase tracking-widest text-muted-foreground/70">
                    Campaña
                  </label>
                  <div className="relative">
                    <select
                      value={filtros.nombre_campana ?? "todos"}
                      onChange={(e) =>
                        setFiltros((f) => ({
                          ...f,
                          nombre_campana:
                            e.target.value === "todos"
                              ? undefined
                              : e.target.value,
                        }))
                      }
                      disabled={loadingCampanas}
                      className="w-full h-11 bg-background/50 border border-border/50 rounded-xl pl-4 pr-10 text-sm text-foreground focus:border-primary/50 focus:ring-4 focus:ring-primary/10 appearance-none outline-none transition-all cursor-pointer"
                    >
                      <option value="todos">Todas las campañas</option>
                      {campanas.map((c: string) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono font-semibold uppercase tracking-widest text-muted-foreground/70">
                    Valor del plan
                  </label>
                  <div className="relative">
                    <select
                      value={
                        filtros.es_alto_valor === true
                          ? "true"
                          : filtros.es_alto_valor === false
                            ? "false"
                            : "todos"
                      }
                      onChange={(e) => {
                        const v = e.target.value;
                        setFiltros((f) => ({
                          ...f,
                          es_alto_valor:
                            v === "todos" ? undefined : v === "true",
                        }));
                      }}
                      className="w-full h-11 bg-background/50 border border-border/50 rounded-xl pl-4 pr-10 text-sm text-foreground focus:border-primary/50 focus:ring-4 focus:ring-primary/10 appearance-none outline-none transition-all cursor-pointer"
                    >
                      <option value="todos">Todos</option>
                      <option value="true">⭐ Alto valor</option>
                      <option value="false">Estándar</option>
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── TABLA ── */}
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <DataTable
              columns={columns}
              data={productos}
              isLoading={isLoading}
              emptyMessage="No hay productos que coincidan con los filtros aplicados"
            />
          </div>

          {/* ── PAGINACIÓN ── */}
          {paginado && (paginado.next || paginado.previous) && (
            <div className="flex items-center justify-between text-xs text-muted-foreground px-2">
              <span>
                <strong className="text-primary font-mono font-semibold">
                  {paginado.count}
                </strong>{" "}
                productos en total
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!paginado.previous}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-4 py-2 rounded-lg bg-card border border-border text-foreground font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                >
                  ← Anterior
                </button>
                <button
                  type="button"
                  disabled={!paginado.next}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-4 py-2 rounded-lg bg-card border border-border text-foreground font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                >
                  Siguiente →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── FORM SHEET ── */}
      <ProductoForm
        open={formOpen}
        onClose={handleCerrarForm}
        productoParaEditar={productoEditar}
      />

      {/* ── CONFIRM DIALOG ── */}
      <ConfirmDialog
        open={!!productoEliminar}
        title="Desactivar producto"
        message={`¿Desactivar el plan "${productoEliminar?.nombre_plan}"? El plan dejará de aparecer en el formulario de ventas. Podrás reactivarlo cuando lo necesites.`}
        confirmLabel="Desactivar"
        accentHex="#ef4444"
        loading={eliminando}
        onConfirm={handleConfirmEliminar}
        onCancel={() => setProductoEliminar(null)}
      />
    </>
  );
}
