import { cn } from "@/lib/utils";
import { memo } from "react";

export const Badge = memo(function Badge({
  label,
  colorClass,
  bgClass,
  borderClass,
  dim = false,
}: {
  label: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  dim?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase border",
        dim
          ? "bg-muted border-border text-muted-foreground/60"
          : cn(bgClass, borderClass, colorClass),
      )}
    >
      {label}
    </span>
  );
});
