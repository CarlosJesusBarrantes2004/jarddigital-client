import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, ChevronDown, Loader2 } from "lucide-react";
import { useBarrasRendimientoMes } from "../hooks/useAnalytics";
import { ESTADO_SOT_OPTIONS, type EstadoSOT } from "../types/analytics.types";

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export const BarrasRendimientoMes = () => {
  const hoy = new Date();
  const [anio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [estadoSot, setEstadoSot] = useState<EstadoSOT>("ATENDIDO");

  const { data, isLoading, isFetching } = useBarrasRendimientoMes({
    anio,
    mes,
    estado_sot: estadoSot,
  });

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 size={16} className="text-primary" />
          <h3 className="text-[14px] font-semibold text-foreground">
            Rendimiento por Asesor — {MESES[mes - 1]}
          </h3>
          {isFetching && !isLoading && (
            <Loader2 size={13} className="animate-spin text-muted-foreground" />
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={mes}
              onChange={(e) => setMes(Number(e.target.value))}
              className="h-9 pl-3 pr-8 rounded-lg border border-border bg-background text-[13px] font-medium appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {MESES.map((m, i) => (
                <option key={i} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
          </div>
          <div className="relative">
            <select
              value={estadoSot}
              onChange={(e) => setEstadoSot(e.target.value as EstadoSOT)}
              className="h-9 pl-3 pr-8 rounded-lg border border-border bg-background text-[13px] font-medium appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {ESTADO_SOT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-72">
          <Loader2 size={20} className="animate-spin text-muted-foreground" />
        </div>
      ) : !data || data.length === 0 ? (
        <div className="flex items-center justify-center h-72 text-[13px] text-muted-foreground">
          Sin ventas registradas para este mes.
        </div>
      ) : (
        <ResponsiveContainer
          width="100%"
          height={Math.max(280, data.length * 36)}
        >
          <BarChart
            data={data}
            layout="vertical"
            margin={{ left: 8, right: 24 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              className="stroke-border"
            />
            <XAxis
              type="number"
              allowDecimals={false}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              type="category"
              dataKey="asesor_nombre"
              width={150}
              tick={{ fontSize: 11 }}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid var(--border)",
                backgroundColor: "var(--card)",
              }}
              formatter={(value) => [value, "Ventas"]}
            />
            <Bar
              dataKey="total_ventas"
              fill="var(--primary)"
              radius={[0, 4, 4, 0]}
              barSize={18}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
