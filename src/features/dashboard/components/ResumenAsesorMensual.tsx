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
import { Loader2, TrendingDown, TrendingUp, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMisMetricas } from "../hooks/useDashboard";

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

export const ResumenAsesorMensual = () => {
  const { data, isLoading } = useMisMetricas();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-72 rounded-xl border border-border bg-card">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) return null;

  const datosGrafico = data.desglose_mensual.map((mes) => ({
    mes: MESES_CORTOS[mes.mes - 1],
    Atendidas: mes.total_atendidas,
    Pagadas: mes.total_pagadas,
  }));

  const proyeccion = data.proyeccion_motivacional;

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-500">
      <div>
        <h1 className="text-[20px] font-bold text-foreground">
          Hola {data.asesor.split(" ")[0]}, Gracias por Venir
        </h1>
        <p className="text-[13px] text-muted-foreground">
          Tu resumen de ventas del {data.anio_evaluado}.
        </p>
      </div>

      {/* Tarjetas de totales */}
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

      {/* Bloque motivacional MTD */}
      {proyeccion && (
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
          <div
            className={cn(
              "w-11 h-11 rounded-full flex items-center justify-center shrink-0",
              proyeccion.tendencia === "MEJOR" &&
                "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
              proyeccion.tendencia === "PEOR" &&
                "bg-red-500/10 text-red-600 dark:text-red-400",
              proyeccion.tendencia === "IGUAL" &&
                "bg-muted text-muted-foreground",
            )}
          >
            {proyeccion.tendencia === "MEJOR" && <TrendingUp size={20} />}
            {proyeccion.tendencia === "PEOR" && <TrendingDown size={20} />}
            {proyeccion.tendencia === "IGUAL" && <Trophy size={20} />}
          </div>
          <div className="flex-1">
            <p className="text-[24px] font-bold text-foreground leading-tight">
              {proyeccion.ventas_mes_actual_hasta_hoy} ventas
              {proyeccion.tendencia !== "IGUAL" && (
                <span
                  className={cn(
                    "text-[13px] font-semibold ml-2",
                    proyeccion.tendencia === "MEJOR"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400",
                  )}
                >
                  {proyeccion.tendencia === "MEJOR" ? "↑" : "↓"}{" "}
                  {proyeccion.porcentaje}%
                </span>
              )}
            </p>
            <p className="text-[13px] text-muted-foreground">
              {proyeccion.mensaje}
            </p>
          </div>
        </div>
      )}

      {/* Gráfico de barras: Atendidas vs Pagadas por mes */}
      <div className="rounded-xl border border-border bg-card p-4">
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
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid var(--border)",
                backgroundColor: "var(--card)",
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar
              dataKey="Atendidas"
              fill="#94a3b8"
              radius={[4, 4, 0, 0]}
              barSize={16}
            />
            <Bar
              dataKey="Pagadas"
              fill="var(--primary)"
              radius={[4, 4, 0, 0]}
              barSize={16}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top productos (opcional, pequeño, complementa sin saturar) */}
      {data.top_productos.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-[14px] font-semibold text-foreground mb-3">
            Tus productos más vendidos
          </h3>
          <div className="flex flex-col gap-2">
            {data.top_productos.map((p, i) => (
              <div
                key={p.nombre}
                className="flex items-center justify-between text-[13px]"
              >
                <span className="text-muted-foreground">
                  <span className="font-mono text-[11px] text-muted-foreground/60 mr-2">
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

const TarjetaTotal = ({
  label,
  valor,
  tono,
}: {
  label: string;
  valor: number;
  tono: "default" | "success" | "warning";
}) => (
  <div className="rounded-xl border border-border bg-card p-4">
    <p className="text-[12px] text-muted-foreground mb-1">{label}</p>
    <p
      className={cn(
        "text-[26px] font-bold",
        tono === "default" && "text-foreground",
        tono === "success" && "text-emerald-600 dark:text-emerald-400",
        tono === "warning" && "text-amber-600 dark:text-amber-400",
      )}
    >
      {valor}
    </p>
  </div>
);
