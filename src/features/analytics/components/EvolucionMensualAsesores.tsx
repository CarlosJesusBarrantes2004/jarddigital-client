import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { LineChart as LineChartIcon, Loader2 } from "lucide-react";
import { useEvolucionMensual } from "../hooks/useAnalytics";
import { FiltrosGlobales } from "./FiltrosGlobales";
import type { EstadoSOT } from "../types/analytics.types";

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

// Paleta cíclica para distinguir asesores en el gráfico de líneas
const PALETA = [
  "#6366f1",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#a855f7",
  "#ec4899",
  "#84cc16",
  "#0ea5e9",
  "#f97316",
];

export const EvolucionMensualAsesores = () => {
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [estadoSot, setEstadoSot] = useState<EstadoSOT>("ATENDIDO");

  const { data, isLoading, isFetching } = useEvolucionMensual({
    anio,
    estado_sot: estadoSot,
  });

  // Transformamos de [{asesor_nombre, num_mes, total_ventas}, ...] (formato "largo")
  // a [{mes: 'Ene', AsesorA: 5, AsesorB: 3}, ...] (formato "ancho" que necesita Recharts)
  const { seriePorMes, nombresAsesores } = useMemo(() => {
    if (!data) return { seriePorMes: [], nombresAsesores: [] };

    const asesoresSet = new Set<string>();
    const mapaMeses = new Map<number, Record<string, number | string>>();

    for (let m = 1; m <= 12; m++) {
      mapaMeses.set(m, { mes: MESES_CORTOS[m - 1] });
    }

    for (const fila of data) {
      if (!fila.num_mes) continue;
      asesoresSet.add(fila.asesor_nombre);
      const filaMes = mapaMeses.get(fila.num_mes);
      if (filaMes) filaMes[fila.asesor_nombre] = fila.total_ventas;
    }

    return {
      seriePorMes: Array.from(mapaMeses.values()),
      nombresAsesores: Array.from(asesoresSet),
    };
  }, [data]);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div className="flex items-center gap-2">
          <LineChartIcon size={16} className="text-primary" />
          <h3 className="text-[14px] font-semibold text-foreground">
            Evolución Mensual por Asesor
          </h3>
          {isFetching && !isLoading && (
            <Loader2 size={13} className="animate-spin text-muted-foreground" />
          )}
        </div>
        <FiltrosGlobales
          anio={anio}
          onAnioChange={setAnio}
          estadoSot={estadoSot}
          onEstadoSotChange={setEstadoSot}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-80">
          <Loader2 size={20} className="animate-spin text-muted-foreground" />
        </div>
      ) : nombresAsesores.length === 0 ? (
        <div className="flex items-center justify-center h-80 text-[13px] text-muted-foreground">
          Sin datos para los filtros seleccionados.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={380}>
          <LineChart
            data={seriePorMes}
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
            {nombresAsesores.map((nombre, i) => (
              <Line
                key={nombre}
                type="monotone"
                dataKey={nombre}
                stroke={PALETA[i % PALETA.length]}
                strokeWidth={2}
                dot={{ r: 2.5 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
