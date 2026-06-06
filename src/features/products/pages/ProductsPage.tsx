import { useState, useMemo, memo, useEffect, useRef } from "react";
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
import { cn } from "@/lib/utils";
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

// ── Debounce ──────────────────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

type Tab = "activos" | "inactivos";

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
              "font-serif text-2xl font-semibold leading-none tracking-tight",
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

export function ProductosPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [productoEditar, setProductoEditar] = useState<Producto | null>(null);
  const [productoEliminar, setProductoEliminar] = useState<Producto | null>(
    null,
  );
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [tab, setTab] = useState<Tab>("activos");

  const [filtros, setFiltros] = useState<Omit<ProductoFiltros, "activo">>({});
  const [busqueda, setBusqueda] = useState("");
  const [page, setPage] = useState(1);
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

  // ---> CORRECCIÓN QA: Agregamos explícitamente el page_size: 50 a los filtros <---
  const filtrosBase = { ...filtros, page, page_size: 50 };
  const filtrosActivos: ProductoFiltros = { ...filtrosBase, activo: true };
  const filtrosInactivos: ProductoFiltros = { ...filtrosBase, activo: false };

  // Solo hacemos fetch de la pestaña que el usuario está viendo actualmente para ahorrar recursos
  const {
    data: dataActivos,
    isLoading: loadingActivos,
    refetch: refetchActivos,
  } = useProductos(filtrosActivos);

  const {
    data: dataInactivos,
    isLoading: loadingInactivos,
    refetch: refetchInactivos,
  } = useProductos(filtrosInactivos);

  const { data: campanas = [], isLoading: loadingCampanas } = useCampanas();
  const { mutateAsync: eliminar, isPending: eliminando } = useDeleteProducto();
  const { mutateAsync: reactivar } = useReactivateProducto();

  const productosActivos: Producto[] = Array.isArray(dataActivos)
    ? dataActivos
    : (dataActivos?.results ?? []);
  const productosInactivos: Producto[] = Array.isArray(dataInactivos)
    ? dataInactivos
    : (dataInactivos?.results ?? []);

  const productos = tab === "activos" ? productosActivos : productosInactivos;

  const stats = useMemo(() => {
    const totalActivos = Array.isArray(dataActivos)
      ? dataActivos.length
      : (dataActivos?.count ?? 0);
    const totalInactivos = Array.isArray(dataInactivos)
      ? dataInactivos.length
      : (dataInactivos?.count ?? 0);

    // El alto valor y promedio se calculan solo de lo que se tiene en memoria actualmente (la página visible)
    const alto_valor = productosActivos.filter((p) => p.es_alto_valor).length;
    const promedio_comision = productosActivos.length
      ? (
          productosActivos.reduce(
            (acc, p) => acc + Number(p.comision_base || 0),
            0,
          ) / productosActivos.length
        ).toFixed(2)
      : "0.00";

    return {
      total: totalActivos + totalInactivos,
      activos: totalActivos,
      inactivos: totalInactivos,
      alto_valor,
      promedio_comision,
    };
  }, [dataActivos, dataInactivos, productosActivos]);

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
      toast.success(`"${productoEliminar.nombre_paquete}" desactivado`);
      setProductoEliminar(null);
      refetchActivos();
      refetchInactivos();
    } catch {
      toast.error("Error al desactivar el producto");
    }
  };

  const handleReactivar = async (p: Producto) => {
    try {
      await reactivar(p.id);
      toast.success(`"${p.nombre_paquete}" reactivado`);
      refetchActivos();
      refetchInactivos();
    } catch {
      toast.error("Error al reactivar el producto");
    }
  };

  const filtrosActivosCount = Object.entries(filtros).filter(
    ([k, v]) => v !== undefined && v !== "" && v !== null && k !== "search",
  ).length;

  const columns = buildColumnsProductos(
    handleEditar,
    setProductoEliminar,
    handleReactivar,
  );

  const paginado =
    tab === "activos"
      ? !Array.isArray(dataActivos)
        ? dataActivos
        : null
      : !Array.isArray(dataInactivos)
        ? dataInactivos
        : null;

  const isLoading = tab === "activos" ? loadingActivos : loadingInactivos;

  // Matemática de la Paginación
  const currentPage = page;
  const totalItems = paginado?.count ?? productos.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / 50));

  return (
    <>
      <div className="space-y-6">
        {/* ── Toolbar ── */}
        <div className="bg-card/50 border border-border rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-foreground tracking-tight">
              Catálogo de Productos
            </h2>
            <p className="text-[13px] text-muted-foreground font-light">
              Gestiona los planes y campañas disponibles para ventas.
            </p>
          </div>
          <button
            type="button"
            onClick={handleNuevo}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-[0_4px_16px_rgba(var(--primary),0.2)] hover:-translate-y-[1px] active:scale-[0.98]"
          >
            <Plus size={16} strokeWidth={2.5} /> Nuevo Producto
          </button>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<Package size={18} strokeWidth={1.5} />}
            label="Total planes"
            value={isLoading ? 0 : stats.total}
            colorClass="text-primary"
            bgClass="bg-primary/10"
            borderClass="border-primary/20"
            isLoading={loadingActivos}
          />
          <StatCard
            icon={<ToggleLeft size={18} strokeWidth={1.5} />}
            label="Activos"
            value={loadingActivos ? 0 : stats.activos}
            colorClass="text-emerald-500"
            bgClass="bg-emerald-500/10"
            borderClass="border-emerald-500/20"
            isLoading={loadingActivos}
          />
          <StatCard
            icon={<Star size={18} strokeWidth={1.5} />}
            label="Alto valor"
            value={loadingActivos ? 0 : stats.alto_valor}
            colorClass="text-[#C9975A]"
            bgClass="bg-[#C9975A]/10"
            borderClass="border-[#C9975A]/20"
            isLoading={loadingActivos}
          />
          <StatCard
            icon={<TrendingUp size={18} strokeWidth={1.5} />}
            label="Comisión prom."
            value={loadingActivos ? "—" : `S/ ${stats.promedio_comision}`}
            colorClass="text-purple-500"
            bgClass="bg-purple-500/10"
            borderClass="border-purple-500/20"
            isLoading={loadingActivos}
          />
        </div>

        {/* ── Tabs Activos / Inactivos ── */}
        <div className="flex gap-1 bg-muted/40 p-1 rounded-xl w-fit border border-border">
          <button
            onClick={() => {
              setTab("activos");
              setPage(1);
            }}
            className={cn(
              "px-5 py-2 rounded-lg text-sm font-medium transition-all duration-150",
              tab === "activos"
                ? "bg-card text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Activos ({loadingActivos ? "…" : stats.activos})
          </button>
          <button
            onClick={() => {
              setTab("inactivos");
              setPage(1);
            }}
            className={cn(
              "px-5 py-2 rounded-lg text-sm font-medium transition-all duration-150",
              tab === "inactivos"
                ? "bg-card text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Inactivos ({loadingInactivos ? "…" : stats.inactivos})
          </button>
        </div>

        {/* ── Filter chips ── */}
        {tab === "activos" && (
          <div className="flex flex-wrap gap-2 items-center">
            <FilterChip
              label="Todos"
              active={Object.keys(filtros).length === 0}
              activeClass="bg-muted text-foreground border-border"
              onClick={limpiar}
            />
            <div className="h-4 w-px bg-border mx-1" />
            <FilterChip
              label="⭐ Alto valor"
              active={(filtros as ProductoFiltros).es_alto_valor === true}
              activeClass="bg-[#C9975A]/10 text-[#C9975A] border-[#C9975A]/30"
              onClick={() => {
                setPage(1);
                setFiltros((f) => ({
                  ...f,
                  es_alto_valor:
                    (f as ProductoFiltros).es_alto_valor === true
                      ? undefined
                      : true,
                }));
              }}
            />
            <div className="h-4 w-px bg-border mx-1" />
            {TIPOS_SOLUCION.map((tipo) => (
              <FilterChip
                key={tipo}
                label={tipo}
                active={(filtros as ProductoFiltros).tipo_solucion === tipo}
                activeClass="bg-primary/10 text-primary border-primary/30"
                onClick={() => {
                  setPage(1);
                  setFiltros((f) => ({
                    ...f,
                    tipo_solucion:
                      (f as ProductoFiltros).tipo_solucion === tipo
                        ? undefined
                        : tipo,
                  }));
                }}
              />
            ))}
          </div>
        )}

        {/* ── Search & filters bar ── */}
        <div className="bg-card/50 border border-border rounded-2xl p-4 shadow-sm flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex-1 w-full relative flex items-center">
              <Search
                size={16}
                className="absolute left-4 text-muted-foreground/60 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Buscar por campaña o paquete…"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full h-11 bg-background/50 border border-border/50 rounded-xl pl-11 pr-10 text-sm text-foreground focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-muted-foreground/60"
              />
              {busqueda && (
                <button
                  type="button"
                  onClick={() => setBusqueda("")}
                  className="absolute right-3.5 text-muted-foreground/50 hover:text-foreground transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
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
                {filtrosActivosCount > 0 && (
                  <span className="w-4 h-4 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[9px] font-bold font-mono">
                    {filtrosActivosCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  refetchActivos();
                  refetchInactivos();
                }}
                title="Refrescar"
                className="w-11 h-11 flex items-center justify-center rounded-xl bg-card border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
              >
                <RefreshCw size={14} />
              </button>
              {(filtrosActivosCount > 0 || busqueda) && (
                <button
                  type="button"
                  onClick={limpiar}
                  className="flex-1 sm:flex-none h-11 px-4 rounded-xl bg-transparent border border-border text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex items-center justify-center gap-2"
                >
                  <X size={12} />
                  <span className="hidden sm:inline">Limpiar todo</span>
                </button>
              )}
            </div>
          </div>

          {mostrarFiltros && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border/50 animate-in fade-in slide-in-from-top-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono font-semibold uppercase tracking-widest text-muted-foreground/70">
                  Campaña
                </label>
                <div className="relative">
                  <select
                    value={
                      (filtros as ProductoFiltros).nombre_campana ?? "todos"
                    }
                    onChange={(e) => {
                      setPage(1);
                      setFiltros((f) => ({
                        ...f,
                        nombre_campana:
                          e.target.value === "todos"
                            ? undefined
                            : e.target.value,
                      }));
                    }}
                    disabled={loadingCampanas}
                    className="w-full h-11 bg-background/50 border border-border/50 rounded-xl pl-4 pr-10 text-sm text-foreground focus:border-primary/50 appearance-none outline-none transition-all cursor-pointer"
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
                      (filtros as ProductoFiltros).es_alto_valor === true
                        ? "true"
                        : (filtros as ProductoFiltros).es_alto_valor === false
                          ? "false"
                          : "todos"
                    }
                    onChange={(e) => {
                      const v = e.target.value;
                      setPage(1);
                      setFiltros((f) => ({
                        ...f,
                        es_alto_valor: v === "todos" ? undefined : v === "true",
                      }));
                    }}
                    className="w-full h-11 bg-background/50 border border-border/50 rounded-xl pl-4 pr-10 text-sm text-foreground focus:border-primary/50 appearance-none outline-none transition-all cursor-pointer"
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

        {/* ── Tabla ── */}
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <DataTable
            columns={columns}
            data={productos}
            isLoading={isLoading}
            emptyMessage={
              tab === "inactivos"
                ? "No hay productos inactivos"
                : "No hay productos que coincidan con los filtros aplicados"
            }
          />

          {/* ---> CORRECCIÓN QA: Controles de paginación explícitos <--- */}
          {paginado && (paginado.next || paginado.previous) && (
            <div className="px-4 py-3 border-t border-border flex items-center justify-between bg-card shrink-0">
              <span className="text-[12px] font-medium text-muted-foreground">
                Página {currentPage} de {totalPages} ({paginado.count} totales)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!paginado.previous}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-8 px-3 rounded-lg border border-border text-[12px] font-medium text-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={!paginado.next}
                  onClick={() => setPage((p) => p + 1)}
                  className="h-8 px-3 rounded-lg border border-border text-[12px] font-medium text-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ProductoForm
        open={formOpen}
        onClose={handleCerrarForm}
        productoParaEditar={productoEditar}
      />

      <ConfirmDialog
        open={!!productoEliminar}
        title="Desactivar producto"
        message={`¿Desactivar el paquete "${productoEliminar?.nombre_paquete}"? Dejará de aparecer en el formulario de ventas. Podrás reactivarlo desde la pestaña Inactivos.`}
        confirmLabel="Desactivar"
        accentHex="#ef4444"
        loading={eliminando}
        onConfirm={handleConfirmEliminar}
        onCancel={() => setProductoEliminar(null)}
      />
    </>
  );
}
