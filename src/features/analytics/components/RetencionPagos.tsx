import { useState } from "react";
import { useRetencionPagos } from "../hooks/useAnalytics";
import { RefreshCw, Filter, Activity } from "lucide-react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const MESES = [
  { v: 1, n: "Enero" },
  { v: 2, n: "Febrero" },
  { v: 3, n: "Marzo" },
  { v: 4, n: "Abril" },
  { v: 5, n: "Mayo" },
  { v: 6, n: "Junio" },
  { v: 7, n: "Julio" },
  { v: 8, n: "Agosto" },
  { v: 9, n: "Septiembre" },
  { v: 10, n: "Octubre" },
  { v: 11, n: "Noviembre" },
  { v: 12, n: "Diciembre" },
];

const CustomTooltip = ({ active, payload, label, totalInstaladas }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border p-3 rounded-lg shadow-xl text-xs z-50 min-w-[150px]">
        <p className="font-bold mb-2 text-foreground border-b border-border pb-1">
          {label}
        </p>
        <div className="flex justify-between items-center mb-1">
          <span className="text-muted-foreground">Pagaron:</span>
          <span className="font-bold text-emerald-500">
            {payload[0]?.value} / {totalInstaladas}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Retención:</span>
          <span className="font-bold text-primary">{payload[1]?.value}%</span>
        </div>
      </div>
    );
  }
  return null;
};

export const RetencionPagos = ({ anioGlobal }: { anioGlobal: number }) => {
  const [mes, setMes] = useState<number>(new Date().getMonth() + 1);
  const [modalidad, setModalidad] = useState<"CALL" | "CAMPO" | "TODAS">(
    "TODAS",
  );

  const { data, isLoading } = useRetencionPagos({
    anio: anioGlobal,
    mes: mes,
    modalidad: modalidad === "TODAS" ? undefined : modalidad,
  });

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-border/50 pb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Activity size={16} className="text-primary" /> Curva de Retención
            de Pagos
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Supervivencia de la cartera instalada en{" "}
            {MESES.find((m) => m.v === mes)?.n} {anioGlobal}.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-1.5 bg-background border border-input rounded-lg px-2 h-8">
            <Filter size={12} className="text-muted-foreground" />
            <select
              value={modalidad}
              onChange={(e) => setModalidad(e.target.value as any)}
              className="text-xs bg-transparent border-none outline-none focus:ring-0 text-foreground cursor-pointer"
            >
              <option value="TODAS">Todo Canal</option>
              <option value="CALL">Call Center</option>
              <option value="CAMPO">Campo</option>
            </select>
          </div>
          <select
            value={mes}
            onChange={(e) => setMes(Number(e.target.value))}
            className="h-8 bg-background border border-input rounded-lg px-2 text-xs outline-none cursor-pointer"
          >
            {MESES.map((m) => (
              <option key={m.v} value={m.v}>
                {m.n}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 w-full min-h-[300px]">
        {isLoading ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
            <RefreshCw size={24} className="animate-spin text-primary mb-2" />
            <span className="text-xs">Procesando cohortes...</span>
          </div>
        ) : !data || data.total_instaladas === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
            No hay instalaciones registradas en este periodo.
          </div>
        ) : (
          <div className="relative w-full h-full">
            <div className="absolute top-0 right-0 bg-primary/10 border border-primary/20 px-3 py-1 rounded-lg text-xs font-mono text-primary font-bold">
              Base Instalada: {data.total_instaladas} ventas
            </div>

            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={data.retencion}
                margin={{ top: 40, right: 0, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#88888833"
                />
                <XAxis
                  dataKey="etiqueta"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#888888" }}
                  dy={10}
                />
                <YAxis
                  yAxisId="left"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#888888" }}
                  domain={[0, data.total_instaladas]}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  hide
                  domain={[0, 100]}
                />

                <Tooltip
                  content={
                    <CustomTooltip totalInstaladas={data.total_instaladas} />
                  }
                  cursor={{ fill: "transparent" }}
                />

                {/* Barras de volumen absolutas */}
                <Bar
                  yAxisId="left"
                  dataKey="pagaron"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={50}
                >
                  {data.retencion.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.porcentaje < 50
                          ? "#ef4444"
                          : entry.porcentaje < 80
                            ? "#f59e0b"
                            : "#10b981"
                      }
                    />
                  ))}
                </Bar>

                {/* Línea de porcentaje de retención */}
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="porcentaje"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: "#card" }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};
