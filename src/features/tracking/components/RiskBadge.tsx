import { cn } from "@/lib/utils";
import { riskLevel } from "../churn";
import type { PrediccionChurn } from "../types";

const styles = {
  ALTO: "bg-red-500/10 text-red-600 dark:text-red-400",
  MEDIO: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
  BAJO: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
};

export function RiskBadge({ prediction }: { prediction?: PrediccionChurn | null }) {
  const level = riskLevel(prediction);
  if (!level) return <span className="text-xs text-muted-foreground">Sin predicción</span>;
  return <span title={`Nivel informado: ${prediction?.nivel_riesgo ?? level}`} className={cn("inline-flex whitespace-nowrap rounded-full px-2 py-1 text-[11px] font-semibold", styles[level])}>
    {level === "ALTO" ? "Alto" : level === "MEDIO" ? "Medio" : "Bajo"} · {((prediction!.probabilidad_churn!) * 100).toFixed(1)}%
  </span>;
}
