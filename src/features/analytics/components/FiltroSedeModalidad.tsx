import { useMemo } from "react";
import { ChevronDown } from "lucide-react";
import type { Modalidad } from "../types/analytics.types";
import { MODALIDAD_OPTIONS } from "../types/analytics.types";

interface FiltroSedeModalidadProps {
  /** Lista de strings "Sede - MODALIDAD" extraídas de los datos ya cargados */
  opcionesSede?: string[];
  filtroSede: string;
  onFiltroSedeChange: (valor: string) => void;
  /** Si true, muestra un select de modalidad con CALL/CAMPO */
  mostrarModalidad?: boolean;
  modalidad?: Modalidad | undefined;
  onModalidadChange?: (valor: Modalidad | undefined) => void;
}

/**
 * Componente reutilizable para filtros de sede/modalidad dentro de los cards de Analytics.
 * Filtra LOCALMENTE los datos ya recibidos (para gráficos que ya devuelven sede_modalidad)
 * o por parámetro de API (para gráficos que requieren filtro en backend).
 */
export const FiltroSedeModalidad = ({
  opcionesSede,
  filtroSede,
  onFiltroSedeChange,
  mostrarModalidad = false,
  modalidad,
  onModalidadChange,
}: FiltroSedeModalidadProps) => {
  const opciones = useMemo(() => {
    if (!opcionesSede) return [];
    return [...new Set(opcionesSede)].sort();
  }, [opcionesSede]);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {opciones.length > 0 && (
        <div className="relative">
          <select
            value={filtroSede}
            onChange={(e) => onFiltroSedeChange(e.target.value)}
            className="h-9 pl-3 pr-8 rounded-lg border border-border bg-background text-[13px] font-medium appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">Todas las sedes</option>
            {opciones.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <ChevronDown
            size={13}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
        </div>
      )}

      {mostrarModalidad && onModalidadChange && (
        <div className="relative">
          <select
            value={modalidad ?? ""}
            onChange={(e) =>
              onModalidadChange(
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
      )}
    </div>
  );
};
