import { useEffect, useMemo, useState } from "react";
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
import { LineChart as LineChartIcon, Loader2, X, ChevronDown } from "lucide-react";
import { useEvolucionMensual } from "../hooks/useAnalytics";
import { FiltrosGlobales } from "./FiltrosGlobales";
import { FiltroSedeModalidad } from "./FiltroSedeModalidad";
import type { EstadoSOT } from "../types/analytics.types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/context/useAuth";

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

const CustomTooltipEvolucion = ({
  active,
  payload,
  label,
  onAsesorClick,
}: any) => {
  if (active && payload && payload.length) {
    // Ordenar de mayor a menor
    const sorted = [...payload].sort((a, b) => (b.value as number) - (a.value as number));

    return (
      <div 
        className="bg-card/95 backdrop-blur-md border border-border p-3 rounded-lg shadow-xl"
        style={{ pointerEvents: 'auto' }}
      >
        <p className="text-[12px] font-bold text-foreground mb-3">{label}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1">
          {sorted.map((entry, index) => (
            <button
              key={index}
              onClick={() => onAsesorClick(entry.dataKey)}
              className="flex items-center gap-2 text-[11px] text-left hover:bg-muted p-1 rounded transition-colors w-full"
            >
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground truncate max-w-[120px]" title={entry.dataKey}>
                {entry.dataKey}
              </span>
              <span className="font-semibold text-foreground shrink-0 ml-auto">
                {entry.value}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

/** Umbral de asesores para considerarse "muchos" y ajustar layout */
export const UMBRAL_MUCHOS_ASESORES = 8;

export const EvolucionMensualAsesores = ({
  onMuchosAsesores,
}: {
  onMuchosAsesores?: (muchos: boolean) => void;
}) => {
  const { user } = useAuth();
  const puedeVerFiltrosSede =
    user?.id_rol?.codigo !== "SUPERVISOR" && user?.id_rol?.codigo !== "ASESOR";

  const [anio, setAnio] = useState(new Date().getFullYear());
  const [estadoSot, setEstadoSot] = useState<EstadoSOT>("ATENDIDO");
  const [filtroSede, setFiltroSede] = useState("");
  const [filtroAsesor, setFiltroAsesor] = useState("");
  const [asesorSeleccionadoPanel, setAsesorSeleccionadoPanel] = useState<string | null>(null);
  const [pinnedMonth, setPinnedMonth] = useState<{
    label: string;
    payload: any[];
  } | null>(null);

  const { data, isLoading, isFetching } = useEvolucionMensual({
    anio,
    estado_sot: estadoSot,
  });

  // Extraer opciones únicas de sede_modalidad
  const opcionesSede = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.map((f) => f.sede_modalidad))].sort();
  }, [data]);

  // Si cambia la sede, resetear el filtro de asesor
  useEffect(() => {
    setFiltroAsesor("");
    setAsesorSeleccionadoPanel(null);
  }, [filtroSede]);

  // Transformamos y filtramos los datos
  const { seriePorMes, nombresAsesores, asesoresDisponiblesPorSede } = useMemo(() => {
    if (!data) return { seriePorMes: [], nombresAsesores: [], asesoresDisponiblesPorSede: [] };

    // 1. Filtrar por sede si hay filtro activo
    const dataPorSede = filtroSede
      ? data.filter((f) => f.sede_modalidad === filtroSede)
      : data;

    // Asesores disponibles en esta sede (para llenar el select)
    const asesoresDisponibles = [...new Set(dataPorSede.map((f) => f.asesor_nombre))].sort();

    // 2. Filtrar por asesor si hay filtro activo
    const dataFinal = filtroAsesor
      ? dataPorSede.filter((f) => f.asesor_nombre === filtroAsesor)
      : dataPorSede;

    const asesoresSet = new Set<string>();
    const mapaMeses = new Map<number, Record<string, number | string | null>>();

    for (let m = 1; m <= 12; m++) {
      mapaMeses.set(m, { mes: MESES_CORTOS[m - 1] });
    }

    for (const fila of dataFinal) {
      if (!fila.num_mes) continue;
      asesoresSet.add(fila.asesor_nombre);
      const filaMes = mapaMeses.get(fila.num_mes);
      if (filaMes) filaMes[fila.asesor_nombre] = fila.total_ventas;
    }

    const serieResult = Array.from(mapaMeses.values());
    
    // Rellenar con 0 explícito para que el connectNulls dibuje la línea bajando a 0 si no hay ventas
    for (const fila of serieResult) {
      for (const asesor of asesoresSet) {
        if (!(asesor in fila)) {
          fila[asesor] = 0;
        }
      }
    }

    return {
      seriePorMes: serieResult,
      nombresAsesores: Array.from(asesoresSet),
      asesoresDisponiblesPorSede: asesoresDisponibles,
    };
  }, [data, filtroSede, filtroAsesor]);

  const tieneMuchosAsesores = nombresAsesores.length > UMBRAL_MUCHOS_ASESORES;

  // Notificar al padre (AnalyticsDashboardPage) para que ajuste el layout de la Fila 1
  useEffect(() => {
    onMuchosAsesores?.(tieneMuchosAsesores);
  }, [tieneMuchosAsesores, onMuchosAsesores]);

  const height = tieneMuchosAsesores ? 480 : 380;

  return (
    <div className="rounded-xl border border-border bg-card p-4 relative overflow-hidden flex flex-col">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4 z-10">
        <div className="flex items-center gap-2">
          <LineChartIcon size={16} className="text-primary" />
          <h3 className="text-[14px] font-semibold text-foreground">
            Evolución Mensual por Asesor
          </h3>
          {isFetching && !isLoading && (
            <Loader2 size={13} className="animate-spin text-muted-foreground" />
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <FiltroSedeModalidad
            opcionesSede={puedeVerFiltrosSede ? opcionesSede : []}
            filtroSede={filtroSede}
            onFiltroSedeChange={setFiltroSede}
          />
          
          {/* Filtro de Asesor (solo visible si se seleccionó una sede) */}
          {filtroSede && (
            <div className="relative">
              <select
                value={filtroAsesor}
                onChange={(e) => {
                  setFiltroAsesor(e.target.value);
                  setAsesorSeleccionadoPanel(null); // cerrar panel si usa filtro global
                }}
                className="h-9 pl-3 pr-8 rounded-lg border border-border bg-background text-[13px] font-medium appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 max-w-[200px] truncate"
              >
                <option value="">Todos los asesores</option>
                {asesoresDisponiblesPorSede.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={13}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
            </div>
          )}

          <FiltrosGlobales
            anio={anio}
            onAnioChange={setAnio}
            estadoSot={estadoSot}
            onEstadoSotChange={setEstadoSot}
          />
        </div>
      </div>

      <div className="flex-1 relative flex">
        <div
          className={cn(
            "flex-1 transition-all duration-500 ease-in-out",
            asesorSeleccionadoPanel ? "pr-[260px] xl:pr-[320px]" : "pr-0"
          )}
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-[380px]">
              <Loader2 size={20} className="animate-spin text-muted-foreground" />
            </div>
          ) : nombresAsesores.length === 0 ? (
            <div className="flex items-center justify-center h-[380px] text-[13px] text-muted-foreground">
              Sin datos para los filtros seleccionados.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={height}>
              <LineChart
                data={seriePorMes}
                margin={{ top: 5, right: 16, bottom: 5, left: 0 }}
                onClick={(e: any) => {
                  if (e && e.activePayload) {
                    if (pinnedMonth?.label === e.activeLabel) {
                      setPinnedMonth(null); // toggle off
                    } else {
                      setPinnedMonth({
                        label: e.activeLabel,
                        payload: e.activePayload,
                      });
                    }
                  } else {
                    setPinnedMonth(null);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                {!pinnedMonth && (
                  <Tooltip
                    content={<CustomTooltipEvolucion onAsesorClick={(asesor: string) => {
                      if (!filtroAsesor) {
                        setAsesorSeleccionadoPanel(asesor);
                        setPinnedMonth(null);
                      }
                    }} />}
                    cursor={{ strokeDasharray: '3 3' }}
                  />
                )}
                <Legend
                  wrapperStyle={{ fontSize: 11 }}
                  layout="horizontal"
                  onClick={(e) => {
                    // Permitir click en la leyenda para mostrar panel si se desea
                    if (e.dataKey && !filtroAsesor) {
                      setAsesorSeleccionadoPanel(String(e.dataKey));
                    }
                  }}
                />
                {nombresAsesores.map((nombre, i) => {
                  const isFaded = asesorSeleccionadoPanel && asesorSeleccionadoPanel !== nombre;
                  const isHighlighted = asesorSeleccionadoPanel === nombre;
                  return (
                    <Line
                      key={nombre}
                      type="monotone"
                      dataKey={nombre}
                      stroke={PALETA[i % PALETA.length]}
                      strokeWidth={isHighlighted ? 4 : 2}
                      dot={{ r: isHighlighted ? 4 : 2.5 }}
                      connectNulls
                      opacity={isFaded ? 0.2 : 1}
                      activeDot={{
                        r: 6,
                        cursor: "pointer",
                        onClick: () => {
                          if (!filtroAsesor) {
                            setAsesorSeleccionadoPanel(nombre);
                          }
                        },
                      }}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          )}

          {/* Overlay Absoluto para Pinned Month (Ventana Flotante Congelada) */}
          {pinnedMonth && (
            <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-background/30 backdrop-blur-[2px]">
              <div className="relative max-w-[90%] max-h-[90%] overflow-y-auto custom-scrollbar shadow-2xl rounded-lg">
                <button
                  onClick={() => setPinnedMonth(null)}
                  className="absolute top-2 right-2 p-1.5 bg-destructive/90 hover:bg-destructive rounded-full text-white transition-colors z-50 shadow-md"
                >
                  <X size={14} />
                </button>
                <CustomTooltipEvolucion
                  active={true}
                  payload={pinnedMonth.payload}
                  label={`${pinnedMonth.label} (Fijado)`}
                  onAsesorClick={(asesor: string) => {
                    if (!filtroAsesor) {
                      setAsesorSeleccionadoPanel(asesor);
                      setPinnedMonth(null);
                    }
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Panel lateral en miniatura (absoluto a la derecha) */}
        <div
          className={cn(
            "absolute top-0 right-0 h-full bg-card/95 backdrop-blur-sm border-l border-border shadow-xl transition-all duration-500 ease-in-out z-20 flex flex-col",
            asesorSeleccionadoPanel
              ? "translate-x-0 w-[260px] xl:w-[320px] opacity-100"
              : "translate-x-full w-[260px] xl:w-[320px] opacity-0"
          )}
        >
          {asesorSeleccionadoPanel && (
            <div className="p-4 flex flex-col h-full">
              <div className="flex items-start justify-between gap-2 mb-4">
                <div>
                  <h4 className="text-[14px] font-bold text-foreground leading-tight">
                    {asesorSeleccionadoPanel}
                  </h4>
                  <p className="text-[12px] text-muted-foreground mt-0.5">
                    Rendimiento Individual
                  </p>
                </div>
                <button
                  onClick={() => setAsesorSeleccionadoPanel(null)}
                  className="p-1 rounded-md hover:bg-muted text-muted-foreground transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={seriePorMes}
                    margin={{ top: 5, right: 10, bottom: 5, left: -20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                    <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        fontSize: 11,
                        borderRadius: 8,
                        border: "1px solid var(--border)",
                        backgroundColor: "var(--card)",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey={asesorSeleccionadoPanel}
                      stroke="var(--primary)"
                      strokeWidth={3}
                      dot={{ r: 3, fill: "var(--primary)" }}
                      activeDot={{ r: 5 }}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              {/* Resumen total abajo */}
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Total Acumulado</p>
                <p className="text-2xl font-bold text-primary mt-1">
                  {seriePorMes.reduce((acc, curr) => acc + ((curr[asesorSeleccionadoPanel] as number) || 0), 0)}
                  <span className="text-sm font-medium text-muted-foreground ml-1">ventas</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
