import { useMemo, useState } from "react";
import { Loader2, TableProperties } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMatrizPivote } from "../hooks/useAnalytics";
import { FiltrosGlobales } from "./FiltrosGlobales";
import { FiltroSedeModalidad } from "./FiltroSedeModalidad";
import type { EstadoSOT } from "../types/analytics.types";
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

export const MatrizPivote = () => {
  const { user } = useAuth();
  const puedeVerFiltrosSede =
    user?.rol?.codigo !== "SUPERVISOR" && user?.rol?.codigo !== "ASESOR";

  const [anio, setAnio] = useState(new Date().getFullYear());
  const [estadoSot, setEstadoSot] = useState<EstadoSOT>("ATENDIDO");
  const [filtroSede, setFiltroSede] = useState("");

  const { data, isLoading, isFetching } = useMatrizPivote({
    anio,
    estado_sot: estadoSot,
  });

  // Extraer opciones únicas de sede_modalidad
  const opcionesSede = useMemo(() => {
    if (!data?.filas) return [];
    return [...new Set(data.filas.map((f) => f.sede_modalidad))].sort();
  }, [data]);

  // Agrupamos filas por sede_modalidad (con filtro aplicado)
  const { gruposPorSede, totalesFiltrados } = useMemo(() => {
    if (!data?.filas) return { gruposPorSede: [], totalesFiltrados: data?.totales_columnas };

    const filasFiltradas = filtroSede
      ? data.filas.filter((f) => f.sede_modalidad === filtroSede)
      : data.filas;

    const mapa = new Map<string, typeof data.filas>();
    for (const fila of filasFiltradas) {
      const grupo = mapa.get(fila.sede_modalidad) ?? [];
      grupo.push(fila);
      mapa.set(fila.sede_modalidad, grupo);
    }

    // Recalcular totales si hay filtro activo
    let totales = data.totales_columnas;
    if (filtroSede) {
      const nuevosTotales: Record<string, number> = { grand_total: 0 };
      for (let m = 1; m <= 12; m++) {
        const suma = filasFiltradas.reduce((acc, f) => acc + ((f[`m${m}`] as number) ?? 0), 0);
        nuevosTotales[`m${m}`] = suma;
        nuevosTotales.grand_total += suma;
      }
      totales = nuevosTotales as unknown as typeof data.totales_columnas;
    }

    return {
      gruposPorSede: Array.from(mapa.entries()),
      totalesFiltrados: totales,
    };
  }, [data, filtroSede]);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between gap-3 p-4 border-b border-border flex-wrap">
        <div className="flex items-center gap-2">
          <TableProperties size={16} className="text-primary" />
          <h3 className="text-[14px] font-semibold text-foreground">
            Matriz de Rendimiento por Asesor
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
          <FiltrosGlobales
            anio={anio}
            onAnioChange={setAnio}
            estadoSot={estadoSot}
            onEstadoSotChange={setEstadoSot}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={20} className="animate-spin text-muted-foreground" />
          </div>
        ) : !data || gruposPorSede.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-[13px] text-muted-foreground">
            Sin datos para los filtros seleccionados.
          </div>
        ) : (
          <table className="w-full text-[12px] border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-muted/50">
                <th className="sticky left-0 bg-muted/50 text-left px-3 py-2 font-semibold text-muted-foreground whitespace-nowrap z-10">
                  Asesor
                </th>
                {MESES_CORTOS.map((m, i) => (
                  <th
                    key={i}
                    className="px-2 py-2 font-semibold text-muted-foreground text-center w-[52px]"
                  >
                    {m}
                  </th>
                ))}
                <th className="px-3 py-2 font-semibold text-primary text-center bg-primary/5">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {gruposPorSede.map(([sede, filas]) => (
                <FragmentoGrupoSede key={sede} sede={sede} filas={filas} />
              ))}
            </tbody>
            {totalesFiltrados && (
              <tfoot>
                <tr className="bg-muted/70 border-t-2 border-border font-semibold">
                  <td className="sticky left-0 bg-muted/70 px-3 py-2 text-foreground whitespace-nowrap">
                    Total general
                  </td>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((mes) => (
                    <td
                      key={mes}
                      className="px-2 py-2 text-center text-foreground"
                    >
                      {(totalesFiltrados[`m${mes}`] as number) ?? 0}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-center text-primary bg-primary/5">
                    {totalesFiltrados.grand_total}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        )}
      </div>
    </div>
  );
};

// Sub-componente: bloque de filas agrupadas por sede/modalidad
const FragmentoGrupoSede = ({
  sede,
  filas,
}: {
  sede: string;
  filas: ReturnType<typeof useMatrizPivote>["data"] extends infer T
    ? T extends { filas: infer F }
      ? F
      : never
    : never;
}) => (
  <>
    <tr>
      <td
        colSpan={14}
        className="sticky left-0 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground bg-muted/30 border-y border-border"
      >
        {sede}
      </td>
    </tr>
    {filas.map((fila) => (
      <tr key={fila.asesor_id} className="hover:bg-muted/20 transition-colors">
        <td className="sticky left-0 bg-card px-3 py-1.5 text-foreground whitespace-nowrap">
          {fila.asesor_nombre}
        </td>
        {Array.from({ length: 12 }, (_, i) => i + 1).map((mes) => {
          const valor = (fila[`m${mes}`] as number) ?? 0;
          return (
            <td
              key={mes}
              className={cn(
                "px-2 py-1.5 text-center",
                valor === 0 ? "text-muted-foreground/40" : "text-foreground",
              )}
            >
              {valor}
            </td>
          );
        })}
        <td className="px-3 py-1.5 text-center font-semibold text-primary bg-primary/5">
          {fila.total_asesor}
        </td>
      </tr>
    ))}
  </>
);
