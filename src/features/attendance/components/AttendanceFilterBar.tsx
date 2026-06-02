import { useMemo } from "react";
import { Filter, Building2, Users, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRoles } from "../api";
import type { AttendanceFilters } from "../types";
import type { AttendanceUser } from "../types";

interface Props {
  filters: AttendanceFilters;
  onFiltersChange: (filters: AttendanceFilters) => void;
  users: AttendanceUser[]; // Necesitamos los usuarios para extraer las modalidades-sede únicas
}

// Genera lista de meses
const MESES = [
  { value: 1, label: "Enero" },
  { value: 2, label: "Febrero" },
  { value: 3, label: "Marzo" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Mayo" },
  { value: 6, label: "Junio" },
  { value: 7, label: "Julio" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Septiembre" },
  { value: 10, label: "Octubre" },
  { value: 11, label: "Noviembre" },
  { value: 12, label: "Diciembre" },
];

// Genera rango de años razonable
function getAnios() {
  const current = new Date().getFullYear();
  return [current - 1, current, current + 1];
}

export function AttendanceFilterBar({
  filters,
  onFiltersChange,
  users,
}: Props) {
  const { data: roles = [] } = useRoles();

  console.log(roles);

  // Extraemos modalidades-sede únicas de los usuarios cargados
  const modalidadesSede = useMemo(() => {
    const map = new Map<
      number,
      { id: number; label: string; id_sucursal: number }
    >();
    users.forEach((u) => {
      u.sucursales?.forEach((s) => {
        if (!map.has(s.id_modalidad_sede)) {
          map.set(s.id_modalidad_sede, {
            id: s.id_modalidad_sede,
            label: `${s.nombre_sucursal} — ${s.nombre_modalidad}`,
            id_sucursal: s.id_sucursal,
          });
        }
      });
    });
    return Array.from(map.values()).sort((a, b) =>
      a.label.localeCompare(b.label),
    );
  }, [users]);

  const selectClass =
    "h-8 pl-3 pr-8 text-[12px] font-medium bg-background border border-border rounded-lg text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/30 hover:border-primary/40 transition-colors";

  const hasActiveFilters =
    filters.rol || filters.modalidad_sede || filters.id_sucursal;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Indicador de filtros activos */}
      <div
        className={cn(
          "flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors",
          hasActiveFilters ? "text-primary" : "text-muted-foreground",
        )}
      >
        <Filter size={13} />
        <span>Filtros</span>
      </div>

      {/* ─── Filtro Mes ─── */}
      <div className="relative">
        <select
          value={filters.mes}
          onChange={(e) =>
            onFiltersChange({ ...filters, mes: Number(e.target.value) })
          }
          className={selectClass}
          aria-label="Filtrar por mes"
        >
          {MESES.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={12}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
      </div>

      {/* ─── Filtro Año ─── */}
      <div className="relative">
        <select
          value={filters.anio}
          onChange={(e) =>
            onFiltersChange({ ...filters, anio: Number(e.target.value) })
          }
          className={selectClass}
          aria-label="Filtrar por año"
        >
          {getAnios().map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <ChevronDown
          size={12}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
      </div>

      {/* Separador */}
      <div className="h-4 w-px bg-border" />

      {/* ─── Filtro Sede-Modalidad ─── */}
      <div className="relative">
        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          <Building2 size={12} />
        </div>
        <select
          value={filters.modalidad_sede ?? ""}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              modalidad_sede: e.target.value ? Number(e.target.value) : null,
              id_sucursal: null, // limpiar filtro de sucursal si elegimos modalidad
            })
          }
          className={cn(
            selectClass,
            "pl-7",
            filters.modalidad_sede && "border-primary/50 text-primary",
          )}
          aria-label="Filtrar por sede-modalidad"
        >
          <option value="">Todas las sedes</option>
          {modalidadesSede.map((ms) => (
            <option key={ms.id} value={ms.id}>
              {ms.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={12}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
      </div>

      {/* ─── Filtro Rol ─── */}
      <div className="relative">
        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          <Users size={12} />
        </div>
        <select
          value={filters.rol ?? ""}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              rol: e.target.value || null,
            })
          }
          className={cn(
            selectClass,
            "pl-7",
            filters.rol && "border-primary/50 text-primary",
          )}
          aria-label="Filtrar por rol"
        >
          <option value="">Todos los roles</option>
          {roles.map((r) => (
            <option key={r.id} value={r.codigo}>
              {r.nombre}
            </option>
          ))}
        </select>
        <ChevronDown
          size={12}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
      </div>

      {/* Botón limpiar filtros opcionales */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={() =>
            onFiltersChange({
              ...filters,
              modalidad_sede: null,
              id_sucursal: null,
              rol: null,
            })
          }
          className="h-8 px-3 text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors border border-transparent hover:border-border"
        >
          Limpiar
        </button>
      )}
    </div>
  );
}
