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
import { ChevronDown, Loader2, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTendenciaDiaria } from "../hooks/useAnalytics";
import { MODALIDAD_OPTIONS, type Modalidad } from "../types/analytics.types";
import { coreService } from "@/features/core/services/coreService";

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

interface SelectorMesAnio {
  anio: number;
  mes: number;
}

export const TendenciaDiariaComparativa = () => {
  const hoy = new Date();
  const mesAnteriorBase =
    hoy.getMonth() === 0
      ? { anio: hoy.getFullYear() - 1, mes: 12 }
      : { anio: hoy.getFullYear(), mes: hoy.getMonth() };

  const [periodoA, setPeriodoA] = useState<SelectorMesAnio>(mesAnteriorBase);
  const [periodoB, setPeriodoB] = useState<SelectorMesAnio>({
    anio: hoy.getFullYear(),
    mes: hoy.getMonth() + 1,
  });
  const [modalidad, setModalidad] = useState<Modalidad | undefined>(undefined);
  const [idSede, setIdSede] = useState<number | undefined>(undefined);

  // Fetch sedes para el select
  const { data: sedes } = useQuery({
    queryKey: ["core", "sucursales"],
    queryFn: coreService.getBranches,
    staleTime: 1000 * 60 * 10,
  });

  const queryA = useTendenciaDiaria({ ...periodoA, modalidad, id_sede: idSede });
  const queryB = useTendenciaDiaria({ ...periodoB, modalidad, id_sede: idSede });

  const isLoading = queryA.isLoading || queryB.isLoading;

  // Fusionamos las dos series por día del mes (eje X = "Día 1", "Día 2"...)
  const serieComparativa = useMemo(() => {
    const maxDias = 31;
    const labelA = `${MESES[periodoA.mes - 1].slice(0, 3)} ${periodoA.anio}`;
    const labelB = `${MESES[periodoB.mes - 1].slice(0, 3)} ${periodoB.anio}`;

    const resultado: Record<string, number | string | null>[] = [];
    for (let dia = 1; dia <= maxDias; dia++) {
      const puntoA = queryA.data?.serie.find(
        (p) => Number(p.fecha.split("-")[2]) === dia,
      );
      const puntoB = queryB.data?.serie.find(
        (p) => Number(p.fecha.split("-")[2]) === dia,
      );
      if (!puntoA && !puntoB && dia > 28) continue; // evitamos colas vacías en meses cortos
      resultado.push({
        dia: `Día ${dia}`,
        [labelA]: puntoA?.total ?? null,
        [labelB]: puntoB?.total ?? null,
      });
    }
    return { datos: resultado, labelA, labelB };
  }, [queryA.data, queryB.data, periodoA, periodoB]);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-primary" />
          <h3 className="text-[14px] font-semibold text-foreground">
            Tendencia Diaria Comparativa
          </h3>
          {(queryA.isFetching || queryB.isFetching) && !isLoading && (
            <Loader2 size={13} className="animate-spin text-muted-foreground" />
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <SelectorPeriodo valor={periodoA} onChange={setPeriodoA} hoy={hoy} />
          <span className="text-[12px] text-muted-foreground">vs</span>
          <SelectorPeriodo valor={periodoB} onChange={setPeriodoB} hoy={hoy} />

          {/* Filtro Sede */}
          {sedes && sedes.length > 0 && (
            <div className="relative">
              <select
                value={idSede ?? ""}
                onChange={(e) =>
                  setIdSede(e.target.value ? Number(e.target.value) : undefined)
                }
                className="h-9 pl-3 pr-8 rounded-lg border border-border bg-background text-[13px] font-medium appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Todas las sedes</option>
                {sedes
                  .filter((s) => s.activo)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre}
                    </option>
                  ))}
              </select>
              <ChevronDown
                size={13}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
            </div>
          )}

          {/* Filtro Modalidad */}
          <div className="relative">
            <select
              value={modalidad ?? ""}
              onChange={(e) =>
                setModalidad(
                  (e.target.value || undefined) as Modalidad | undefined,
                )
              }
              className="h-9 pl-3 pr-8 rounded-lg border border-border bg-background text-[13px] font-medium appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Todas</option>
              {MODALIDAD_OPTIONS.map((o) => (
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
        <div className="flex items-center justify-center h-80">
          <Loader2 size={20} className="animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={340}>
            <LineChart
              data={serieComparativa.datos}
              margin={{ top: 5, right: 16, bottom: 5, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="dia" tick={{ fontSize: 10 }} interval={2} />
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
              <Line
                type="monotone"
                dataKey={serieComparativa.labelA}
                stroke="#94a3b8"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey={serieComparativa.labelB}
                stroke="var(--primary)"
                strokeWidth={2.5}
                dot={false}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>

          <div className="flex gap-6 mt-3 pt-3 border-t border-border">
            <div>
              <p className="text-[11px] text-muted-foreground">
                {serieComparativa.labelA}
              </p>
              <p className="text-[18px] font-bold text-foreground">
                {queryA.data?.total_mes ?? 0}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">
                {serieComparativa.labelB}
              </p>
              <p className="text-[18px] font-bold text-primary">
                {queryB.data?.total_mes ?? 0}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Sub-componente: par de selects (mes + año) para cada periodo a comparar
const SelectorPeriodo = ({
  valor,
  onChange,
  hoy,
}: {
  valor: SelectorMesAnio;
  onChange: (v: SelectorMesAnio) => void;
  hoy: Date;
}) => (
  <div className="flex items-center gap-1">
    <div className="relative">
      <select
        value={valor.mes}
        onChange={(e) => onChange({ ...valor, mes: Number(e.target.value) })}
        className="h-9 pl-2.5 pr-7 rounded-lg border border-border bg-background text-[12px] font-medium appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        {MESES.map((m, i) => (
          <option key={i} value={i + 1}>
            {m.slice(0, 3)}
          </option>
        ))}
      </select>
      <ChevronDown
        size={11}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
      />
    </div>
    <div className="relative">
      <select
        value={valor.anio}
        onChange={(e) => onChange({ ...valor, anio: Number(e.target.value) })}
        className="h-9 pl-2.5 pr-7 rounded-lg border border-border bg-background text-[12px] font-medium appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        {[hoy.getFullYear(), hoy.getFullYear() - 1].map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>
      <ChevronDown
        size={11}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
      />
    </div>
  </div>
);
