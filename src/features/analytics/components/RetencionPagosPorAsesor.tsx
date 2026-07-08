import { useMemo, useState, useEffect } from "react";
import { Loader2, Users, Filter, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/api/axios";
import { useRetencionPagosPorAsesor } from "../hooks/useAnalytics";
import { useAuth } from "@/features/auth/context/useAuth";
import type { RetencionAsesorFila } from "../types/analytics.types";

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

const restarMeses = (fecha: Date, offset: number) => {
  const anio = fecha.getFullYear();
  const mes = fecha.getMonth() + 1;
  const totalMeses = anio * 12 + (mes - 1) - offset;
  return { anio: Math.floor(totalMeses / 12), mes: (totalMeses % 12) + 1 };
};

const colorPorcentaje = (pct: number, sinDatos: boolean) => {
  if (sinDatos) return "text-muted-foreground/40";
  if (pct < 50) return "text-red-600 dark:text-red-400";
  if (pct < 80) return "text-amber-600 dark:text-amber-400";
  return "text-emerald-600 dark:text-emerald-400";
};

export const RetencionPagosPorAsesor = () => {
  const { user } = useAuth();
  const puedeVerFiltrosSede =
    user?.rol?.codigo !== "SUPERVISOR" && user?.rol?.codigo !== "ASESOR";

  const hoy = new Date();
  const periodoPorDefecto = restarMeses(hoy, 2);

  const [anio, setAnio] = useState<number>(periodoPorDefecto.anio);
  const [mes, setMes] = useState<number>(periodoPorDefecto.mes);
  const [idModalidadSede, setIdModalidadSede] = useState<number | "TODAS">(
    "TODAS",
  );
  const [sedesOpciones, setSedesOpciones] = useState<
    { id: number; etiqueta: string }[]
  >([]);

  useEffect(() => {
    const fetchSedes = async () => {
      try {
        const { data } = await api.get("/core/sucursales-modalidades/");
        setSedesOpciones(data.results || data);
      } catch (error) {
        console.error("Error al cargar sedes:", error);
      }
    };
    fetchSedes();
  }, []);

  const { data, isLoading, isFetching } = useRetencionPagosPorAsesor({
    anio,
    mes,
    id_modalidad_sede:
      idModalidadSede === "TODAS" ? undefined : idModalidadSede,
  });

  // Agrupamos por sede_modalidad para renderizar bloques, igual que MatrizPivote
  const gruposPorSede = useMemo(() => {
    if (!data) return [];
    const mapa = new Map<string, RetencionAsesorFila[]>();
    for (const fila of data) {
      const grupo = mapa.get(fila.sede_modalidad) ?? [];
      grupo.push(fila);
      mapa.set(fila.sede_modalidad, grupo);
    }
    return Array.from(mapa.entries());
  }, [data]);

  const nombreMesActual = MESES.find((m) => m.v === mes)?.n;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between gap-3 p-4 border-b border-border flex-wrap">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-primary" />
          <h3 className="text-[14px] font-semibold text-foreground">
            Retención de Pagos por Asesor — {nombreMesActual} {anio}
          </h3>
          {isFetching && !isLoading && (
            <Loader2 size={13} className="animate-spin text-muted-foreground" />
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {puedeVerFiltrosSede && sedesOpciones.length > 0 && (
            <div className="flex items-center gap-1.5 bg-background border border-input rounded-lg px-2 h-9 max-w-[200px]">
              <Filter size={12} className="text-muted-foreground shrink-0" />
              <select
                value={idModalidadSede}
                onChange={(e) =>
                  setIdModalidadSede(
                    e.target.value === "TODAS"
                      ? "TODAS"
                      : Number(e.target.value),
                  )
                }
                className="text-[13px] bg-transparent border-none outline-none focus:ring-0 text-foreground cursor-pointer truncate w-full"
              >
                <option value="TODAS">Todas las Sedes</option>
                {sedesOpciones.map((sede) => (
                  <option key={sede.id} value={sede.id}>
                    {sede.etiqueta}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-1.5 bg-background border border-input rounded-lg px-2 h-9">
            <Calendar size={12} className="text-muted-foreground" />
            <select
              value={mes}
              onChange={(e) => setMes(Number(e.target.value))}
              className="text-[13px] bg-transparent border-none outline-none focus:ring-0 text-foreground cursor-pointer"
            >
              {MESES.map((m) => (
                <option key={m.v} value={m.v}>
                  {m.n}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-background border border-input rounded-lg px-2 h-9">
            <select
              value={anio}
              onChange={(e) => setAnio(Number(e.target.value))}
              className="text-[13px] font-semibold bg-transparent border-none outline-none focus:ring-0 text-primary cursor-pointer"
            >
              {[
                hoy.getFullYear() - 1,
                hoy.getFullYear(),
                hoy.getFullYear() + 1,
              ].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={20} className="animate-spin text-muted-foreground" />
          </div>
        ) : !data || gruposPorSede.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-[13px] text-muted-foreground">
            Sin ventas instaladas en {nombreMesActual} {anio} para calcular
            retención.
          </div>
        ) : (
          <table className="w-full text-[12px] border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-muted/50">
                <th className="sticky left-0 bg-muted/50 text-left px-3 py-2 font-semibold text-muted-foreground whitespace-nowrap z-10">
                  Asesor
                </th>
                <th className="px-2 py-2 font-semibold text-muted-foreground text-center w-[60px]">
                  Total
                </th>
                {Array.from({ length: 6 }, (_, i) => i + 1).map((m) => (
                  <th
                    key={m}
                    className="px-2 py-2 font-semibold text-muted-foreground text-center w-[90px]"
                  >
                    Mes {m}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gruposPorSede.map(([sede, filas]) => (
                <FragmentoGrupoSede key={sede} sede={sede} filas={filas} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const FragmentoGrupoSede = ({
  sede,
  filas,
}: {
  sede: string;
  filas: RetencionAsesorFila[];
}) => (
  <>
    <tr>
      <td
        colSpan={8}
        className="sticky left-0 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground bg-muted/30 border-y border-border"
      >
        {sede}
      </td>
    </tr>
    {filas.map((fila) => {
      const sinDatos = fila.total_instaladas === 0;
      return (
        <tr
          key={fila.asesor_id}
          className="hover:bg-muted/20 transition-colors"
        >
          <td className="sticky left-0 bg-card px-3 py-1.5 text-foreground whitespace-nowrap">
            {fila.asesor_nombre}
          </td>
          <td className="px-2 py-1.5 text-center font-semibold text-primary bg-primary/5">
            {fila.total_instaladas}
          </td>
          {fila.retencion.map((r) => (
            <td key={r.mes_cobro} className="px-2 py-1.5 text-center">
              {sinDatos ? (
                <span className="text-muted-foreground/30">—</span>
              ) : (
                <span
                  className={cn(
                    "font-medium",
                    colorPorcentaje(r.porcentaje, sinDatos),
                  )}
                >
                  {r.pagaron}/{fila.total_instaladas}
                  <span className="text-[10px] ml-1 opacity-70">
                    ({r.porcentaje}%)
                  </span>
                </span>
              )}
            </td>
          ))}
        </tr>
      );
    })}
  </>
);
