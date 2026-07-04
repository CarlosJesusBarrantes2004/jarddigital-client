import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, ChevronDown, Loader2, TrendingUp } from "lucide-react";
import { useBarrasRendimientoMes } from "../hooks/useAnalytics";
import { ESTADO_SOT_OPTIONS, type EstadoSOT } from "../types/analytics.types";
import { FiltroSedeModalidad } from "./FiltroSedeModalidad";

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
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [estadoSot, setEstadoSot] = useState<EstadoSOT>("ATENDIDO");
  const [filtroSede, setFiltroSede] = useState("");

  const { data, isLoading, isFetching } = useBarrasRendimientoMes({
    anio,
    mes,
    estado_sot: estadoSot,
  });

  // Extraer opciones únicas de sede_modalidad de los datos
  const opcionesSede = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.map((f) => f.sede_modalidad))].sort();
  }, [data]);

  // Filtrar datos localmente por sede_modalidad
  const dataFiltrada = useMemo(() => {
    if (!data) return [];
    if (!filtroSede) return data;
    return data.filter((f) => f.sede_modalidad === filtroSede);
  }, [data, filtroSede]);

  // Total de ventas según filtro
  const totalVentas = useMemo(() => {
    return dataFiltrada.reduce((acc, f) => acc + f.total_ventas, 0);
  }, [dataFiltrada]);

  // Datos con porcentaje calculado
  const dataConPorcentaje = useMemo(() => {
    if (totalVentas === 0) return dataFiltrada;
    return dataFiltrada.map((f) => ({
      ...f,
      porcentaje: Math.round((f.total_ventas / totalVentas) * 100),
    }));
  }, [dataFiltrada, totalVentas]);

  // Custom label para mostrar total + porcentaje al lado de cada barra
  const renderBarLabel = (props: any) => {
    const { x, y, width, height, value, index } = props;
    const item = dataConPorcentaje[index] as any;
    if (!item) return null;
    return (
      <text
        x={x + width + 6}
        y={y + height / 2}
        fill="var(--foreground)"
        fontSize={11}
        fontWeight={600}
        dominantBaseline="central"
      >
        {value} ({item.porcentaje}%)
      </text>
    );
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 size={16} className="text-primary" />
          <h3 className="text-[14px] font-semibold text-foreground">
            Rendimiento por Asesor — {MESES[mes - 1]} {anio}
          </h3>
          {isFetching && !isLoading && (
            <Loader2 size={13} className="animate-spin text-muted-foreground" />
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <FiltroSedeModalidad
            opcionesSede={opcionesSede}
            filtroSede={filtroSede}
            onFiltroSedeChange={setFiltroSede}
          />

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
              value={anio}
              onChange={(e) => setAnio(Number(e.target.value))}
              className="h-9 pl-3 pr-8 rounded-lg border border-border bg-background text-[13px] font-medium appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {[hoy.getFullYear(), hoy.getFullYear() - 1, hoy.getFullYear() - 2].map((a) => (
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

      {/* Card con total de ventas */}
      {!isLoading && dataFiltrada.length > 0 && (
        <div className="flex items-center gap-2 mb-3 px-1">
          <div className="flex items-center gap-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg">
            <TrendingUp size={14} />
            <span className="text-[12px] font-bold">
              {totalVentas} ventas totales
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground">
            {dataFiltrada.length} asesor(es)
          </span>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-72">
          <Loader2 size={20} className="animate-spin text-muted-foreground" />
        </div>
      ) : !dataFiltrada || dataFiltrada.length === 0 ? (
        <div className="flex items-center justify-center h-72 text-[13px] text-muted-foreground">
          Sin ventas registradas para este mes.
        </div>
      ) : (
        <ResponsiveContainer
          width="100%"
          height={Math.max(280, dataConPorcentaje.length * 36)}
        >
          <BarChart
            data={dataConPorcentaje}
            layout="vertical"
            margin={{ left: 8, right: 72 }}
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
            <Bar
              dataKey="total_ventas"
              fill="#3b82f6"
              radius={[0, 4, 4, 0]}
              barSize={18}
            >
              <LabelList
                dataKey="total_ventas"
                content={renderBarLabel}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
