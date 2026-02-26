import { cn } from "@/lib/utils";
import type { EstadoSOT } from "../types/sales.types";

interface EstadoBadgeProps {
  estado?: Pick<EstadoSOT, "nombre" | "color_hex" | "codigo"> | null;
  fallback?: string;
  size?: "sm" | "md";
  esReingresada?: boolean;
}

export function EstadoBadge({
  estado,
  fallback = "Sin estado",
  size = "md",
  esReingresada = false,
}: EstadoBadgeProps) {
  if (!estado) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 font-medium text-zinc-500",
          size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-xs",
        )}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
        {fallback}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-xs",
      )}
      style={{
        backgroundColor: estado.color_hex + "20",
        color: estado.color_hex,
        border: `1px solid ${estado.color_hex}40`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: estado.color_hex }}
      />
      {estado.nombre}
      {esReingresada && (
        <span className="ml-1 rounded bg-amber-100 px-1 text-[10px] font-bold uppercase text-amber-700">
          Reingresada
        </span>
      )}
    </span>
  );
}

// Badge simplificado cuando solo tenemos código+color
interface SimpleBadgeProps {
  label: string;
  colorHex: string;
  size?: "sm" | "md";
}

export function ColorBadge({ label, colorHex, size = "md" }: SimpleBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-xs",
      )}
      style={{
        backgroundColor: colorHex + "20",
        color: colorHex,
        border: `1px solid ${colorHex}40`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: colorHex }}
      />
      {label}
    </span>
  );
}
