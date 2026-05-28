import { useState } from "react";
import { Search, Filter, X, ChevronDown, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { MESES_ES } from "../utils";
import { exportarExcelPendientes } from "../api";
import type { SeguimientoFilters, EstadoSeguimientoType } from "../types";
import { useAuth } from "@/features/auth/context/useAuth";

interface FilterBarProps {
  filters: SeguimientoFilters;
  onChange: (filters: SeguimientoFilters) => void;
  role: "encargado" | "asesor";
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-7 px-3 rounded-full text-[11px] font-semibold border transition-all whitespace-nowrap",
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-transparent text-muted-foreground border-border hover:border-primary/40 hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

function Select({
  value,
  onChange,
  options,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
  placeholder: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-8 pl-2.5 pr-7 rounded-lg border border-border bg-background text-[12px] text-foreground appearance-none focus:outline-none focus:ring-1 focus:ring-primary/50 cursor-pointer"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={12}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
      />
    </div>
  );
}

// ---> NUEVO COMPONENTE: MultiSelect con Checkboxes <---
function MultiSelectCheckbox({
  values = [],
  onChange,
  options,
  placeholder,
  className,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  options: { label: string; value: string }[];
  placeholder: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  const toggle = (val: string) => {
    if (values.includes(val)) {
      onChange(values.filter((v) => v !== val));
    } else {
      onChange([...values, val]);
    }
  };

  const getLabel = () => {
    if (values.length === 0) return placeholder;
    if (values.length === 1)
      return options.find((o) => o.value === values[0])?.label;
    if (values.length === options.length) return "Todos los meses";
    return `${values.length} meses selec.`;
  };

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full h-8 pl-2.5 pr-7 rounded-lg border border-border bg-background text-[11px] text-foreground flex items-center focus:outline-none focus:ring-1 focus:ring-primary/50"
      >
        <span className="truncate flex-1 text-left">{getLabel()}</span>
        <ChevronDown
          size={12}
          className="absolute right-2 text-muted-foreground shrink-0"
        />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-[calc(100%+4px)] left-0 min-w-full w-max bg-popover border border-border rounded-xl shadow-xl z-50 py-1.5 flex flex-col max-h-[240px] overflow-y-auto animate-in fade-in slide-in-from-top-2">
            {options.map((o) => (
              <label
                key={o.value}
                className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-muted/50 cursor-pointer text-[11px] text-foreground transition-colors"
              >
                <input
                  type="checkbox"
                  checked={values.includes(o.value)}
                  onChange={() => toggle(o.value)}
                  className="rounded border-border accent-primary w-3.5 h-3.5"
                />
                {o.label}
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const ANIO_ACTUAL = new Date().getFullYear();
const ANIOS = [ANIO_ACTUAL - 1, ANIO_ACTUAL, ANIO_ACTUAL + 1];

export function SeguimientoFilterBar({
  filters,
  onChange,
  role,
}: FilterBarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { user } = useAuth();

  const workspaces = user?.sucursales ?? [];

  const activeCount = Object.entries(filters).filter(
    ([k, v]) =>
      k !== "search" &&
      k !== "page" &&
      k !== "page_size" &&
      v !== undefined &&
      v !== "" &&
      v !== null &&
      (Array.isArray(v) ? v.length > 0 : true),
  ).length;

  const update = (partial: Partial<SeguimientoFilters>) =>
    onChange({ ...filters, ...partial, page: 1 });

  const clear = () => onChange({ page: 1, page_size: 50 });

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await exportarExcelPendientes(filters);
    } catch (error) {
      console.error("Error al exportar Excel", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Row 1: Search + toggles + Export */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-[360px]">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            value={filters.search ?? ""}
            onChange={(e) => update({ search: e.target.value || undefined })}
            placeholder="Buscar por código, nombre, pago..."
            className="w-full h-8 pl-8 pr-3 rounded-lg border border-border bg-background text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => update({ search: undefined })}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={12} />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={cn(
            "flex items-center gap-2 h-8 px-3 rounded-lg border text-[12px] font-medium transition-all",
            showAdvanced || activeCount > 0
              ? "border-primary/40 bg-primary/5 text-primary"
              : "border-border text-muted-foreground hover:text-foreground",
          )}
        >
          <Filter size={12} />
          Filtros
          {activeCount > 0 && (
            <span className="bg-primary text-primary-foreground text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </button>

        {activeCount > 0 && (
          <button
            type="button"
            onClick={clear}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] text-destructive hover:bg-destructive/10 transition-colors"
          >
            <X size={12} /> Limpiar
          </button>
        )}

        {role === "encargado" && (
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="ml-auto flex items-center gap-1.5 h-8 px-3 rounded-lg bg-emerald-600 text-white text-[12px] font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            <Download size={13} />
            {isExporting ? "Generando..." : "Exportar Pendientes"}
          </button>
        )}
      </div>

      {/* Row 2: Quick chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {role === "encargado" && (
          <>
            <FilterChip
              label="Masculino"
              active={filters.genero === "M"}
              onClick={() =>
                update({ genero: filters.genero === "M" ? undefined : "M" })
              }
            />
            <FilterChip
              label="Femenino"
              active={filters.genero === "F"}
              onClick={() =>
                update({ genero: filters.genero === "F" ? undefined : "F" })
              }
            />
          </>
        )}

        <FilterChip
          label="Alto Valor"
          active={filters.es_alto_valor === true}
          onClick={() =>
            update({
              es_alto_valor: filters.es_alto_valor === true ? undefined : true,
            })
          }
        />
        <FilterChip
          label="Primer Mes Pagado"
          active={filters.primer_mes_pagado === true}
          onClick={() =>
            update({
              primer_mes_pagado:
                filters.primer_mes_pagado === true ? undefined : true,
            })
          }
        />
        <FilterChip
          label="Sin primer pago"
          active={filters.primer_mes_pagado === false}
          onClick={() =>
            update({
              primer_mes_pagado:
                filters.primer_mes_pagado === false ? undefined : false,
            })
          }
        />
        <FilterChip
          label="Con descuento"
          active={filters.descuento_realizado === true}
          onClick={() =>
            update({
              descuento_realizado:
                filters.descuento_realizado === true ? undefined : true,
            })
          }
        />
        <FilterChip
          label="Sin descuento"
          active={filters.descuento_realizado === false}
          onClick={() =>
            update({
              descuento_realizado:
                filters.descuento_realizado === false ? undefined : false,
            })
          }
        />

        {(
          ["PENALIZADO", "SUSPENDIDO", "DESACTIVADO"] as EstadoSeguimientoType[]
        ).map((e) => (
          <FilterChip
            key={e}
            label={e.charAt(0) + e.slice(1).toLowerCase()}
            active={filters.estado === e}
            onClick={() =>
              update({ estado: filters.estado === e ? undefined : e })
            }
          />
        ))}
      </div>

      {/* Advanced filters panel */}
      {showAdvanced && (
        <div className="flex items-center gap-4 flex-wrap pt-3 border-t border-border/50">
          {role === "encargado" && workspaces.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest">
                Sede:
              </span>
              <Select
                value={String(filters.modalidad_sede ?? "")}
                onChange={(v) =>
                  update({ modalidad_sede: v ? Number(v) : undefined })
                }
                placeholder="Todas las sedes"
                options={workspaces.map((ws) => ({
                  label: `${ws.nombre_sucursal} - ${ws.nombre_modalidad}`,
                  value: String(ws.id_modalidad_sede),
                }))}
                className="w-48"
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest">
              Instalación:
            </span>
            {/* CORRECCIÓN: Instanciamos el MultiSelect para los meses */}
            <MultiSelectCheckbox
              values={(filters.mes_instalacion ?? []).map(String)}
              onChange={(arr) => update({ mes_instalacion: arr.map(Number) })}
              placeholder="Meses"
              options={MESES_ES.map((m, i) => ({
                label: m,
                value: String(i + 1),
              }))}
              className="w-[140px]"
            />
            <Select
              value={String(filters.anio_instalacion ?? "")}
              onChange={(v) =>
                update({ anio_instalacion: v ? Number(v) : undefined })
              }
              placeholder="Año"
              options={ANIOS.map((a) => ({
                label: String(a),
                value: String(a),
              }))}
              className="w-24"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest">
              Pago Desde/Hasta:
            </span>
            <input
              type="date"
              value={filters.fecha_pago_desde ?? ""}
              onChange={(e) =>
                update({ fecha_pago_desde: e.target.value || undefined })
              }
              className="h-8 px-2 rounded-lg border border-border bg-background text-[11px] focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
            <input
              type="date"
              value={filters.fecha_pago_hasta ?? ""}
              onChange={(e) =>
                update({ fecha_pago_hasta: e.target.value || undefined })
              }
              className="h-8 px-2 rounded-lg border border-border bg-background text-[11px] focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest">
              Seguim. Desde/Hasta:
            </span>
            <input
              type="date"
              value={filters.fecha_seguimiento_desde ?? ""}
              onChange={(e) =>
                update({ fecha_seguimiento_desde: e.target.value || undefined })
              }
              className="h-8 px-2 rounded-lg border border-border bg-background text-[11px] focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
            <input
              type="date"
              value={filters.fecha_seguimiento_hasta ?? ""}
              onChange={(e) =>
                update({ fecha_seguimiento_hasta: e.target.value || undefined })
              }
              className="h-8 px-2 rounded-lg border border-border bg-background text-[11px] focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
        </div>
      )}
    </div>
  );
}
