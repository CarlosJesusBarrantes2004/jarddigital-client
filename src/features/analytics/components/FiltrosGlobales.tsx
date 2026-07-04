import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ESTADO_SOT_OPTIONS, type EstadoSOT } from "../types/analytics.types";

interface FiltrosGlobalesProps {
  anio: number;
  onAnioChange: (anio: number) => void;
  estadoSot: EstadoSOT;
  onEstadoSotChange: (estado: EstadoSOT) => void;
  anioDesde?: number;
  className?: string;
}



export const FiltrosGlobales = ({
  anio,
  onAnioChange,
  estadoSot,
  onEstadoSotChange,
  anioDesde = 2020,
  className,
}: FiltrosGlobalesProps) => {
  const anios = generarAniosDisponibles(anioDesde);

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      <div className="relative">
        <input
          type="number"
          min={2020}
          max={new Date().getFullYear() + 1}
          value={anio}
          onChange={(e) => onAnioChange(Number(e.target.value))}
          className="h-9 w-20 px-3 rounded-lg border border-border bg-background text-[13px] font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
        />
      </div>

      <div className="relative">
        <select
          value={estadoSot}
          onChange={(e) => onEstadoSotChange(e.target.value as EstadoSOT)}
          className="h-9 pl-3 pr-8 rounded-lg border border-border bg-background text-[13px] font-medium text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
        >
          {ESTADO_SOT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={13}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
      </div>
    </div>
  );
};
