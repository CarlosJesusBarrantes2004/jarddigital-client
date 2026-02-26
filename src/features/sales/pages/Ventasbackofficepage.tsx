import { useState } from "react";
import { Search, RefreshCw, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import {
  useVentas,
  useEstadosSOT,
  useEstadosAudio,
  useProductos,
} from "../hooks/useSales";
import type { Venta, VentaFiltros } from "../types/sales.types";
import { DataTable } from "../components/VentasTable";
import { buildColumnsBackoffice } from "../components/VentasTable/columnsBackoffice";
import { VentaFormBackoffice } from "../components/VentaFormBackoffice";

export function VentasBackofficePage() {
  const [ventaSeleccionada, setVentaSeleccionada] = useState<Venta | null>(
    null,
  );
  const [filtros, setFiltros] = useState<VentaFiltros>({});
  const [busqueda, setBusqueda] = useState("");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const { data, isLoading, refetch } = useVentas(filtros);
  const { data: estadosSOT = [] } = useEstadosSOT();
  const { data: estadosAudio = [] } = useEstadosAudio();
  const { data: productos = [] } = useProductos();

  const ventas = data?.results ?? [];

  // Contador de filtros activos
  const filtrosActivos = Object.entries(filtros).filter(
    ([k, v]) => v !== undefined && v !== "" && k !== "search",
  ).length;

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    setFiltros((f) => ({ ...f, search: busqueda }));
  };

  const handleFiltroEstado = (valor: string) => {
    setFiltros((f) => ({
      ...f,
      id_estado_sot: valor === "todos" ? undefined : valor,
    }));
  };

  const handleFiltroAudio = (valor: string) => {
    setFiltros((f) => ({
      ...f,
      id_estado_audios: valor === "todos" ? undefined : valor,
    }));
  };

  const handleFiltroProducto = (valor: string) => {
    setFiltros((f) => ({
      ...f,
      id_producto: valor === "todos" ? undefined : valor,
    }));
  };

  const limpiarFiltros = () => {
    setFiltros({});
    setBusqueda("");
  };

  const columns = buildColumnsBackoffice(estadosSOT, (v) =>
    setVentaSeleccionada(v),
  );

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
        {/* ── HEADER ── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">
              Gestión de Ventas
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              {data?.count !== undefined && (
                <span>
                  <span className="font-semibold text-zinc-700">
                    {data.count}
                  </span>{" "}
                  ventas en tu sucursal
                </span>
              )}
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            title="Refrescar"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* ── BARRA DE BÚSQUEDA Y FILTROS ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <form
              className="flex flex-1 items-center gap-2"
              onSubmit={handleBuscar}
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  placeholder="Buscar por cliente, DNI, código SOT/SEC..."
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
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className={cn("gap-2", mostrarFiltros && "bg-zinc-100")}
            >
              <Filter className="h-4 w-4" />
              Filtros
              {filtrosActivos > 0 && (
                <Badge className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                  {filtrosActivos}
                </Badge>
              )}
            </Button>

            {filtrosActivos > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={limpiarFiltros}
                className="gap-1 text-xs text-zinc-500"
              >
                <X className="h-3.5 w-3.5" />
                Limpiar filtros
              </Button>
            )}
          </div>

          {/* Panel de filtros expandible */}
          {mostrarFiltros && (
            <div className="grid grid-cols-1 gap-3 rounded-xl border border-zinc-200 bg-white p-4 sm:grid-cols-3">
              {/* Estado SOT */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-zinc-500">Estado SOT</p>
                <Select
                  onValueChange={handleFiltroEstado}
                  value={
                    filtros.id_estado_sot
                      ? String(filtros.id_estado_sot)
                      : "todos"
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los estados</SelectItem>
                    <SelectItem value="null">Sin estado (pendiente)</SelectItem>
                    {estadosSOT.map((e) => (
                      <SelectItem key={e.id} value={String(e.id)}>
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: e.color_hex }}
                          />
                          {e.nombre}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Estado Audios */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-zinc-500">
                  Estado Audios
                </p>
                <Select
                  onValueChange={handleFiltroAudio}
                  value={
                    filtros.id_estado_audios
                      ? String(filtros.id_estado_audios)
                      : "todos"
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {estadosAudio.map((ea) => (
                      <SelectItem key={ea.id} value={String(ea.id)}>
                        {ea.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Producto */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-zinc-500">
                  Plan/Producto
                </p>
                <Select
                  onValueChange={handleFiltroProducto}
                  value={
                    filtros.id_producto ? String(filtros.id_producto) : "todos"
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los planes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los planes</SelectItem>
                    {productos.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.nombre_plan}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* ── INDICADORES RÁPIDOS ── */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            {
              label: "Pendientes",
              fn: () => setFiltros({ id_estado_sot: "null" }),
              color: "bg-zinc-100 text-zinc-700",
            },
            {
              label: "En Ejecución",
              fn: () =>
                setFiltros({
                  id_estado_sot: String(
                    estadosSOT.find((e) => e.codigo === "EJECUCION")?.id,
                  ),
                }),
              color: "bg-blue-50 text-blue-700",
            },
            {
              label: "Reingresadas",
              fn: () => setFiltros({}),
              color: "bg-amber-50 text-amber-700",
            },
          ].map((chip) => (
            <button
              key={chip.label}
              onClick={chip.fn}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:opacity-80",
                chip.color,
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* ── TABLA ── */}
        <DataTable
          columns={columns}
          data={ventas}
          isLoading={isLoading}
          emptyMessage="No hay ventas que coincidan con los filtros aplicados"
        />

        {/* Paginación */}
        {data && (data.next || data.previous) && (
          <div className="flex items-center justify-between text-sm text-zinc-500">
            <span>{data.count} venta(s) en total</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={!data.previous}>
                Anterior
              </Button>
              <Button variant="outline" size="sm" disabled={!data.next}>
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL GESTIÓN ── */}
      {/* key={venta.id} fuerza remount al cambiar de venta */}
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
