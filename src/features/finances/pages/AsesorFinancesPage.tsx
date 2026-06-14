import { useState, useEffect, useCallback } from "react";
import {
  Wallet,
  TrendingUp,
  AlertTriangle,
  BadgeDollarSign,
  Info,
  RefreshCw,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import {
  getMiDashboardFinanciero,
  extraerErrorFinanzas,
} from "../services/finances.api";
import { type MiDashboardRespuesta } from "../services/finances.api";
import { api } from "@/api/axios";

const MESES = [
  { valor: 1, nombre: "Enero" },
  { valor: 2, nombre: "Febrero" },
  { valor: 3, nombre: "Marzo" },
  { valor: 4, nombre: "Abril" },
  { valor: 5, nombre: "Mayo" },
  { valor: 6, nombre: "Junio" },
  { valor: 7, nombre: "Julio" },
  { valor: 8, nombre: "Agosto" },
  { valor: 9, nombre: "Septiembre" },
  { valor: 10, nombre: "Octubre" },
  { valor: 11, nombre: "Noviembre" },
  { valor: 12, nombre: "Diciembre" },
];

export const AsesorFinancesPage = () => {
  const hoy = new Date();

  // Por defecto, cargamos el mes actual (el backend evaluará internamente las ventas del mes anterior)
  const [mes, setMes] = useState<number>(hoy.getMonth() + 1);
  const [anio, setAnio] = useState<number>(hoy.getFullYear());

  const [dashboard, setDashboard] = useState<MiDashboardRespuesta | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Estado auxiliar para la tabla de desglose
  const [detalleVentas, setDetalleVentas] = useState<any[]>([]);

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Traemos los totales
      const data = await getMiDashboardFinanciero(mes, anio);
      setDashboard(data);

      // 2. PETICIÓN AUXILIAR PARA LA TABLA (Vía rápida frontend)
      // Nota: Le pedimos al endpoint de ventas las instaladas el mes anterior
      const mesAnterior = mes === 1 ? 12 : mes - 1;
      const anioAnterior = mes === 1 ? anio - 1 : anio;

      const { data: ventasResponse } = await api.get(`/sales/ventas/`, {
        params: {
          mes_instalacion: mesAnterior,
          anio_instalacion: anioAnterior,
          // Idealmente agregaríamos un filtro ?pagadas=true si el backend lo soporta
        },
      });
      // Asumimos que viene paginado { results: [...] } o directo [...]
      setDetalleVentas(ventasResponse.results || ventasResponse || []);
    } catch (error) {
      console.error(error);
      setDashboard(null);
      toast.error("No pudimos cargar tus finanzas");
    } finally {
      setIsLoading(false);
    }
  }, [mes, anio]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const mesAnteriorObj = MESES.find(
    (m) => m.valor === (mes === 1 ? 12 : mes - 1),
  );

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6 animate-in fade-in duration-300">
      {/* CABECERA Y FILTROS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card border border-border rounded-xl p-5 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Wallet className="text-primary" />
            Mi Liquidación
          </h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
            <Info size={14} />
            Tu sueldo de{" "}
            <strong>{MESES.find((m) => m.valor === mes)?.nombre}</strong> se
            calcula en base a tus ventas de{" "}
            <strong>{mesAnteriorObj?.nombre}</strong>.
          </p>
        </div>

        <div className="flex gap-3">
          <select
            value={mes}
            onChange={(e) => setMes(Number(e.target.value))}
            className="h-10 bg-background border border-input rounded-md px-3 text-sm focus:ring-2 focus:ring-primary outline-none"
          >
            {MESES.map((m) => (
              <option key={m.valor} value={m.valor}>
                {m.nombre}
              </option>
            ))}
          </select>
          <select
            value={anio}
            onChange={(e) => setAnio(Number(e.target.value))}
            className="h-10 bg-background border border-input rounded-md px-3 text-sm focus:ring-2 focus:ring-primary outline-none"
          >
            {[anio - 1, anio, anio + 1].map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <RefreshCw size={32} className="animate-spin text-primary mb-4" />
          <p>Calculando comisiones en vivo...</p>
        </div>
      ) : dashboard ? (
        <>
          {/* TARJETAS DE RESUMEN (CARDS) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* CARD 1: Sueldo Base */}
            <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between shadow-sm">
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-muted-foreground">
                  Sueldo Base Aplicado
                </span>
                <div className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg">
                  <BadgeDollarSign size={18} />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-2xl font-bold text-foreground">
                  S/ {Number(dashboard.sueldo_base_aplicado).toFixed(2)}
                </span>
                {dashboard.escenario_aplicado === "ELITE" && (
                  <p className="text-[11px] font-medium text-yellow-600 mt-1 uppercase tracking-wider">
                    ★ Escenario Élite Activado
                  </p>
                )}
              </div>
            </div>

            {/* CARD 2: Descuentos */}
            <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between shadow-sm">
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-muted-foreground">
                  Descuento Inasistencias
                </span>
                <div className="p-2 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-lg">
                  <AlertTriangle size={18} />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                  - S/ {Number(dashboard.descuento_faltas).toFixed(2)}
                </span>
                <p className="text-xs text-muted-foreground mt-1">
                  Registraste {dashboard.dias_falta} falta(s) en{" "}
                  {MESES.find((m) => m.valor === mes)?.nombre}
                </p>
              </div>
            </div>

            {/* CARD 3: Comisiones */}
            <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between shadow-sm">
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-muted-foreground">
                  Comisiones Ganadas
                </span>
                <div className="p-2 bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded-lg">
                  <TrendingUp size={18} />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-2xl font-bold text-green-600 dark:text-green-500">
                  + S/ {Number(dashboard.comision_neta).toFixed(2)}
                </span>
                <div className="flex items-center gap-2 mt-1 text-xs">
                  <span className="text-muted-foreground">
                    Multiplicador AV:
                  </span>
                  <span
                    className={cn(
                      "font-bold",
                      Number(dashboard.multiplicador_av) >= 1.1
                        ? "text-green-600"
                        : Number(dashboard.multiplicador_av) === 1.0
                          ? "text-yellow-600"
                          : "text-red-500",
                    )}
                  >
                    x{Number(dashboard.multiplicador_av).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* CARD 4: Neto Final */}
            <div className="bg-primary text-primary-foreground border-transparent rounded-xl p-5 flex flex-col justify-between shadow-md relative overflow-hidden">
              <div className="absolute -right-6 -top-6 text-primary-foreground/10">
                <Wallet size={120} />
              </div>
              <div className="relative z-10 flex justify-between items-start">
                <span className="text-sm font-medium text-primary-foreground/80 uppercase tracking-wider">
                  Neto a Depositar
                </span>
              </div>
              <div className="relative z-10 mt-4">
                <span className="text-4xl font-black">
                  S/ {Number(dashboard.sueldo_neto_final).toFixed(2)}
                </span>
                <p className="text-xs text-primary-foreground/70 mt-1">
                  Sujeto a confirmación final de RRHH.
                </p>
              </div>
            </div>
          </div>

          {/* TABLA DE DETALLE DE VENTAS DEL MES ANTERIOR */}
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col mt-4">
            <div className="p-4 border-b border-border bg-muted/20 flex justify-between items-center">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Package size={16} className="text-primary" />
                Ventas de {mesAnteriorObj?.nombre} (Base para comisión)
              </h3>
              <div className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  {dashboard.ventas_pagadas}
                </span>{" "}
                pagadas de{" "}
                <span className="font-medium text-foreground">
                  {dashboard.ventas_instaladas}
                </span>{" "}
                instaladas
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-[11px] font-semibold tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Producto / Plan</th>
                    <th className="px-4 py-3 text-center">
                      Estado de Pago (Seguimiento)
                    </th>
                    <th className="px-4 py-3 text-right">Costo Fijo</th>
                    <th className="px-4 py-3 text-right">Comisión Base</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {detalleVentas.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-8 text-center text-muted-foreground"
                      >
                        No hay ventas registradas para este periodo.
                      </td>
                    </tr>
                  ) : (
                    detalleVentas.map((venta: any) => (
                      <tr key={venta.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">
                            {venta.cliente_nombre}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Doc: {venta.cliente_numero_doc}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">
                            {venta.producto_paquete || "Plan Base"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {venta.producto_campana || "Campaña"}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {venta.pago_primer_mes ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                              Pagado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-500">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                              Pendiente
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {/* MOCK DE COSTO - Esto dependerá de la data real de ventas */}
                          S/ {Number(venta.producto_costo_fijo || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-foreground">
                          {/* MOCK COMISIÓN */}
                          S/{" "}
                          {Number(venta.producto_comision_base || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
