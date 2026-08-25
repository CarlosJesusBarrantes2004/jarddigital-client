import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Loader2, Sparkles, TrendingDown, TrendingUp, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMisMetricas } from "../hooks/useDashboard";
import type { ProyeccionMotivacional } from "../types/dashboard.types";

const MESES_CORTOS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

/** Celeste de identidad (sky-400 / sky-500) alineado con el primary del tema. */
const COLOR_ATENDIDAS = "#38bdf8";
const COLOR_ATENDIDAS_HOVER = "#0ea5e9";
const COLOR_PAGADAS = "hsl(197 100% 45%)";
const COLOR_PAGADAS_HOVER = "hsl(197 100% 38%)";

export const ResumenAsesorMensual = () => {
  const { data, isLoading } = useMisMetricas();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-72 rounded-xl border border-border bg-card shadow-sm">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) return null;

  const nombreAsesor = data.asesor.trim().split(/\s+/)[0] || "asesor";

  const datosGrafico = data.desglose_mensual.map((mes) => ({
    mes: MESES_CORTOS[mes.mes - 1],
    Atendidas: mes.total_atendidas,
    Pagadas: mes.total_pagadas,
  }));

  const proyeccion = data.proyeccion_motivacional;

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-500">
      <div>
        <h1 className="text-[20px] font-bold text-foreground tracking-tight">
          Hola, {nombreAsesor}
        </h1>
        <p className="text-[13px] text-muted-foreground">
          Tu resumen de ventas del {data.anio_evaluado}.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <TarjetaTotal
          label="Total Atendidas"
          valor={data.totales_anio.gran_total_atendidas}
          tono="default"
        />
        <TarjetaTotal
          label="Pagadas (Mes 1)"
          valor={data.totales_anio.gran_total_pagadas}
          tono="success"
        />
        <TarjetaTotal
          label="Pendientes"
          valor={data.totales_anio.gran_total_pendientes}
          tono="warning"
        />
      </div>

      {proyeccion && <TarjetaRendimiento proyeccion={proyeccion} />}

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md hover:border-sky-400/30 transition-all duration-200">
        <h3 className="text-[14px] font-semibold text-foreground mb-4">
          Ventas por Mes
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={datosGrafico}
            margin={{ top: 5, right: 16, bottom: 5, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip
              cursor={{ fill: "hsl(197 100% 45% / 0.08)" }}
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid var(--border)",
                backgroundColor: "var(--card)",
                boxShadow: "0 8px 24px hsl(197 100% 45% / 0.12)",
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar
              dataKey="Atendidas"
              fill={COLOR_ATENDIDAS}
              radius={[4, 4, 0, 0]}
              barSize={16}
              activeBar={{ fill: COLOR_ATENDIDAS_HOVER }}
            />
            <Bar
              dataKey="Pagadas"
              fill={COLOR_PAGADAS}
              radius={[4, 4, 0, 0]}
              barSize={16}
              activeBar={{ fill: COLOR_PAGADAS_HOVER }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {data.top_productos.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md hover:border-sky-400/30 transition-all duration-200">
          <h3 className="text-[14px] font-semibold text-foreground mb-3">
            Tus productos más vendidos
          </h3>
          <div className="flex flex-col gap-2">
            {data.top_productos.map((p, i) => (
              <div
                key={p.nombre}
                className="flex items-center justify-between text-[13px] rounded-lg px-2 py-1.5 -mx-2 hover:bg-sky-500/5 transition-colors"
              >
                <span className="text-muted-foreground">
                  <span className="font-mono text-[11px] text-sky-500/70 mr-2">
                    #{i + 1}
                  </span>
                  {p.nombre}
                </span>
                <span className="font-semibold text-foreground">{p.total}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const TarjetaRendimiento = ({
  proyeccion,
}: {
  proyeccion: ProyeccionMotivacional;
}) => {
  const ventasActuales = proyeccion.ventas_mes_actual_hasta_hoy;
  const ventasAnteriores = proyeccion.ventas_mes_anterior_hasta_hoy;
  const vaAtras = ventasActuales < ventasAnteriores;
  const copy = construirMensajeRendimiento(ventasActuales, ventasAnteriores);

  return (
    <div
      className={cn(
        "rounded-xl p-4 flex items-center gap-4 border shadow-sm transition-all duration-200",
        vaAtras
          ? "bg-sky-500/5 border-sky-400/40 hover:border-sky-400/70 hover:shadow-md hover:shadow-sky-500/10"
          : "bg-emerald-500/5 border-emerald-400/40 hover:border-emerald-400/70 hover:shadow-md hover:shadow-emerald-500/10",
      )}
    >
      <div
        className={cn(
          "w-11 h-11 rounded-full flex items-center justify-center shrink-0",
          vaAtras
            ? "bg-sky-500/10 text-sky-600 dark:text-sky-400"
            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        )}
      >
        {vaAtras && <TrendingDown size={20} />}
        {!vaAtras && ventasActuales > ventasAnteriores && <TrendingUp size={20} />}
        {!vaAtras && ventasActuales === ventasAnteriores && <Trophy size={20} />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-[22px] font-bold text-foreground leading-tight">
            {ventasActuales} ventas
          </p>
          {proyeccion.tendencia !== "IGUAL" && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[12px] font-semibold px-2 py-0.5 rounded-full",
                vaAtras
                  ? "bg-sky-500/10 text-sky-700 dark:text-sky-300"
                  : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
              )}
            >
              {vaAtras ? "↓" : "↑"} {proyeccion.porcentaje}%
            </span>
          )}
          <Sparkles
            size={14}
            className={cn(
              "shrink-0",
              vaAtras
                ? "text-sky-500/70"
                : "text-emerald-500/70",
            )}
          />
        </div>
        <p className="text-[13px] text-foreground/80 mt-1 leading-relaxed">
          {copy}
        </p>
      </div>
    </div>
  );
};

const construirMensajeRendimiento = (
  ventasActuales: number,
  ventasAnteriores: number,
): string => {
  if (ventasActuales < ventasAnteriores) {
    return `Llevas ${ventasActuales} ventas vs. ${ventasAnteriores} del mes anterior. ¡Aún queda tiempo para remontar y cerrar con fuerza el mes! 💪✨`;
  }

  if (ventasActuales === ventasAnteriores) {
    return `¡Buen ritmo! Llevas ${ventasActuales} ventas, igualando las ${ventasAnteriores} del mes anterior. Sigue así 🚀`;
  }

  return `¡Excelente ritmo! Llevas ${ventasActuales} ventas superando las ${ventasAnteriores} del mes anterior. Sigue así 🚀`;
};

const TarjetaTotal = ({
  label,
  valor,
  tono,
}: {
  label: string;
  valor: number;
  tono: "default" | "success" | "warning";
}) => (
  <div
    className={cn(
      "rounded-xl border bg-card p-4 shadow-sm transition-all duration-200 hover:shadow-md",
      tono === "default" && "border-border hover:border-sky-400/40",
      tono === "success" && "border-border hover:border-emerald-400/40",
      tono === "warning" && "border-border hover:border-amber-400/40",
    )}
  >
    <p className="text-[12px] text-muted-foreground mb-1">{label}</p>
    <p
      className={cn(
        "text-[26px] font-bold",
        tono === "default" && "text-sky-600 dark:text-sky-400",
        tono === "success" && "text-emerald-600 dark:text-emerald-400",
        tono === "warning" && "text-amber-600 dark:text-amber-400",
      )}
    >
      {valor}
    </p>
  </div>
);
