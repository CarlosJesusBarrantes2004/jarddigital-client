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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import {
  useVentas,
  useEstadisticasAsesor,
  useEstadosSOT,
} from "../hooks/useSales";
import type { Venta, VentaFiltros } from "../types/sales.types";
import { DataTable } from "../components/VentasTable";
import { buildColumnsAsesor } from "../components/VentasTable/columnsAsesor";
import { VentaFormAsesor } from "../components/VentaFormAsesor";

// ── TARJETA DE ESTADÍSTICA ──
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  bgColor: string;
  isLoading?: boolean;
}

function StatCard({
  icon,
  label,
  value,
  color,
  bgColor,
  isLoading,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border p-4 transition-shadow hover:shadow-md",
        bgColor,
      )}
    >
      <div className={cn("rounded-lg p-2", color)}>{icon}</div>
      <div>
        <p className="text-xs font-medium text-zinc-500">{label}</p>
        <p className="text-2xl font-bold text-zinc-800">
          {isLoading ? (
            <span className="inline-block h-7 w-10 animate-pulse rounded bg-zinc-200" />
          ) : (
            value
          )}
        </p>
      </div>
    </div>
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

  const columns = buildColumnsAsesor(estadosSOT, handleReingresar);

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
        {/* ── HEADER ── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Mis Ventas</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Gestiona y registra tus ventas de servicios Claro
            </p>
          </div>
          <Button
            onClick={() => {
              setVentaParaReingresar(null);
              setFormOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Nueva Venta
          </Button>
        </div>

        {/* ── ESTADÍSTICAS ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard
            icon={<ShoppingBag className="h-5 w-5 text-zinc-600" />}
            label="Total"
            value={stats.total}
            color="bg-zinc-100"
            bgColor="border-zinc-200 bg-white"
            isLoading={loadingStats}
          />
          <StatCard
            icon={<Zap className="h-5 w-5 text-blue-600" />}
            label="En Ejecución"
            value={stats.en_ejecucion}
            color="bg-blue-50"
            bgColor="border-blue-100 bg-blue-50/50"
            isLoading={loadingStats}
          />
          <StatCard
            icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
            label="Atendidas"
            value={stats.atendidas}
            color="bg-emerald-50"
            bgColor="border-emerald-100 bg-emerald-50/50"
            isLoading={loadingStats}
          />
          <StatCard
            icon={<XCircle className="h-5 w-5 text-red-500" />}
            label="Rechazadas"
            value={stats.rechazadas}
            color="bg-red-50"
            bgColor="border-red-100 bg-red-50/50"
            isLoading={loadingStats}
          />
          <StatCard
            icon={<Clock className="h-5 w-5 text-amber-500" />}
            label="Pendientes"
            value={stats.pendientes}
            color="bg-amber-50"
            bgColor="border-amber-100 bg-amber-50/50"
            isLoading={loadingStats}
          />
        </div>

        {/* ── FILTROS ── */}
        <div className="flex items-center gap-3">
          <form
            className="flex flex-1 items-center gap-2"
            onSubmit={handleBuscar}
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                placeholder="Buscar por nombre, DNI, código SOT/SEC..."
                className="pl-9"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <Button type="submit" variant="outline" size="icon">
              <Search className="h-4 w-4" />
            </Button>
          </form>
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            title="Refrescar"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* ── TABLA ── */}
        <DataTable
          columns={columns}
          data={ventas}
          isLoading={isLoading}
          emptyMessage="No tienes ventas registradas aún. ¡Crea tu primera venta!"
        />

        {/* Paginación simple */}
        {data && (data.next || data.previous) && (
          <div className="flex items-center justify-between text-sm text-zinc-500">
            <span>{data.count} venta(s) en total</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!data.previous}
                onClick={() => {
                  /* implementar paginación */
                }}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!data.next}
                onClick={() => {
                  /* implementar paginación */
                }}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL FORM ── */}
      <VentaFormAsesor
        open={formOpen}
        onClose={handleCerrarForm}
        ventaOrigen={ventaParaReingresar}
      />
    </div>
  );
}
