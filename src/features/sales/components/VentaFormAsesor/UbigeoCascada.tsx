import { useEffect } from "react";
import { ChevronDown, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useDepartamentos,
  useProvincias,
  useDistritos,
} from "../../hooks/useSales";

function SelectCascada({ val, onChange, items, load, dis, place, error }: any) {
  return (
    <div className="relative">
      <select
        value={val ?? ""}
        onChange={(e) =>
          onChange(e.target.value ? Number(e.target.value) : null)
        }
        disabled={dis || load}
        className={cn(
          "w-full h-11 pl-3.5 pr-10 rounded-xl bg-background border text-[13px] font-sans outline-none appearance-none transition-all duration-200 focus:ring-4 focus:ring-primary/10",
          dis || load
            ? "cursor-not-allowed opacity-60 bg-muted"
            : "cursor-pointer hover:border-primary/50",
          val ? "text-foreground" : "text-muted-foreground",
          error
            ? "border-destructive focus:border-destructive"
            : "border-border focus:border-primary",
        )}
      >
        <option value="">{load ? "Cargando…" : place}</option>
        {items.map((i: any) => (
          <option key={i.id} value={i.id}>
            {i.nombre}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
      />
    </div>
  );
}

// ── 2. Componente Principal ──
interface UbigeoCascadaProps {
  label: string;
  depId: number | null;
  provId: number | null;
  distId: number | null;
  onDepChange: (id: number | null) => void;
  onProvChange: (id: number | null) => void;
  onDistChange: (id: number | null) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}

export function UbigeoCascada({
  label,
  depId,
  provId,
  distId,
  onDepChange,
  onProvChange,
  onDistChange,
  error,
  disabled,
  required,
}: UbigeoCascadaProps) {
  const { data: departamentos = [], isLoading: loadDep } = useDepartamentos();
  const { data: provincias = [], isLoading: loadProv } = useProvincias(depId);
  const { data: distritos = [], isLoading: loadDist } = useDistritos(provId);

  // Limpiar niveles inferiores cuando cambia el padre
  useEffect(() => {
    onProvChange(null);
    onDistChange(null);
  }, [depId]); // eslint-disable-line

  useEffect(() => {
    onDistChange(null);
  }, [provId]); // eslint-disable-line

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
          {label} {required && <span className="text-destructive">*</span>}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SelectCascada
          val={depId}
          onChange={onDepChange}
          items={departamentos}
          load={loadDep}
          dis={disabled}
          place="1. Departamento"
          error={error && !depId} // Marca error si falta
        />

        <SelectCascada
          val={provId}
          onChange={onProvChange}
          items={provincias}
          load={loadProv}
          dis={disabled || !depId}
          place={depId ? "2. Provincia" : "Selec. Departamento"}
          error={error && depId && !provId}
        />

        <SelectCascada
          val={distId}
          onChange={onDistChange}
          items={distritos}
          load={loadDist}
          dis={disabled || !provId}
          place={provId ? "3. Distrito" : "Selec. Provincia"}
          error={error && provId && !distId}
        />
      </div>

      {error && (
        <p className="text-[11px] text-destructive mt-0.5 flex items-center gap-1">
          <AlertTriangle size={10} /> {error}
        </p>
      )}
    </div>
  );
}
