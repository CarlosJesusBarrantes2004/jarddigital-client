import { cn } from "@/lib/utils";

interface EstadoBadgeProps {
  estado: {
    nombre: string;
    codigo: string;
    color_hex: string;
  } | null;
  size?: "xs" | "sm" | "md";
}

export function EstadoBadge({ estado, size = "sm" }: EstadoBadgeProps) {
  const paddingClass = {
    xs: "px-2 py-0.5",
    sm: "px-2.5 py-1",
    md: "px-3.5 py-1.5",
  }[size];

  const fontSizeClass = {
    xs: "text-[10px]",
    sm: "text-[11px]",
    md: "text-xs",
  }[size];

  const dotSizeClass = {
    xs: "w-1.5 h-1.5",
    sm: "w-[6px] h-[6px]",
    md: "w-2 h-2",
  }[size];

  if (!estado) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full font-mono font-medium tracking-widest bg-muted border border-border text-muted-foreground",
          paddingClass,
          fontSizeClass,
        )}
      >
        <span
          className={cn(
            "rounded-full bg-muted-foreground/30 shrink-0",
            dotSizeClass,
          )}
        />
        Pendiente
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-mono font-medium tracking-widest border",
        paddingClass,
        fontSizeClass,
      )}
      style={{
        backgroundColor: `${estado.color_hex}15`,
        borderColor: `${estado.color_hex}30`,
        color: estado.color_hex,
      }}
    >
      <span
        className={cn("rounded-full shrink-0", dotSizeClass)}
        style={{
          backgroundColor: estado.color_hex,
          boxShadow: `0 0 8px ${estado.color_hex}80`,
        }}
      />
      {estado.nombre}
    </span>
  );
}
