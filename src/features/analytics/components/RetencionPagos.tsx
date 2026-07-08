import { useState, useEffect } from "react";
import { useRetencionPagos } from "../hooks/useAnalytics";
import { RefreshCw, Filter, Activity, Calendar } from "lucide-react";
import { api } from "@/api/axios";
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

export const RetencionPagos = () => {
  const hoy = new Date();
  const anioActual = hoy.getFullYear();
  const mesActual = hoy.getMonth() + 1;
  const mesPorDefecto = mesActual === 1 ? 12 : mesActual - 1;
  const anioPorDefecto = mesActual === 1 ? anioActual - 1 : anioActual;

  const [anio, setAnio] = useState<number>(anioPorDefecto);
  const [mes, setMes] = useState<number>(mesPorDefecto);

  // --- NUEVO ESTADO PARA LAS SEDES ---
  const [idModalidadSede, setIdModalidadSede] = useState<number | "TODAS">(
    "TODAS",
  );
  const [sedesOpciones, setSedesOpciones] = useState<
    { id: number; etiqueta: string }[]
  >([]);

  // Efecto para cargar las sedes del backend
  useEffect(() => {
    const fetchSedes = async () => {
      try {
        const { data } = await api.get("/core/modalidades-sede/");
        // DRF con paginación devuelve data.results
        setSedesOpciones(data.results || data);
      } catch (error) {
        console.error("Error al cargar sedes:", error);
      }
    };
    fetchSedes();
  }, []);

  const { data, isLoading } = useRetencionPagos({
    anio: anio,
    mes: mes,
    id_modalidad_sede:
      idModalidadSede === "TODAS" ? undefined : idModalidadSede,
  });

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-border/50 pb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Activity size={16} className="text-primary" /> Curva de Retención
            de Pagos
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Supervivencia de la cartera instalada en{" "}
            {MESES.find((m) => m.v === mes)?.n} {anio}.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {/* NUEVO: Dropdown dinámico con las sedes de la base de datos */}
          <div className="flex items-center gap-1.5 bg-background border border-input rounded-lg px-2 h-8 max-w-[200px]">
            <Filter size={12} className="text-muted-foreground shrink-0" />
            <select
              value={idModalidadSede}
              onChange={(e) =>
                setIdModalidadSede(
                  e.target.value === "TODAS" ? "TODAS" : Number(e.target.value),
                )
              }
              className="text-xs bg-transparent border-none outline-none focus:ring-0 text-foreground cursor-pointer truncate w-full"
            >
              <option value="TODAS">Todas las Sedes</option>
              {sedesOpciones.map((sede) => (
                <option key={sede.id} value={sede.id}>
                  {sede.etiqueta}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-background border border-input rounded-lg px-2 h-8">
            <Calendar size={12} className="text-muted-foreground" />
            <select
              value={mes}
              onChange={(e) => setMes(Number(e.target.value))}
              className="text-xs bg-transparent border-none outline-none focus:ring-0 text-foreground cursor-pointer"
            >
              {MESES.map((m) => (
                <option key={m.v} value={m.v}>
                  {m.n}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-background border border-input rounded-lg px-2 h-8">
            <select
              value={anio}
              onChange={(e) => setAnio(Number(e.target.value))}
              className="text-xs font-semibold bg-transparent border-none outline-none focus:ring-0 text-primary cursor-pointer"
            >
              {[anioActual - 1, anioActual, anioActual + 1].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full min-h-[300px]">
        {isLoading ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
            <RefreshCw size={24} className="animate-spin text-primary mb-2" />
            <span className="text-xs">Procesando cohortes...</span>
          </div>
        ) : !data || data.total_instaladas === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground border-2 border-dashed border-border rounded-xl">
            No hay instalaciones registradas en{" "}
            {MESES.find((m) => m.v === mes)?.n} para calcular la retención.
          </div>
        ) : (
          <div className="relative w-full h-full">
            <div className="absolute top-0 right-0 bg-primary/10 border border-primary/20 px-3 py-1 rounded-lg text-xs font-mono text-primary font-bold z-10">
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

                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="porcentaje"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: "var(--card)" }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};
