import { riskLevel } from "../churn";
import type { Seguimiento } from "../types";

export function RetentionSummaryWidget({ rows, loading, error, onRetry }: { rows: Seguimiento[]; loading: boolean; error: boolean; onRetry: () => void }) {
  const active = rows.filter(row => row.activo && row.estado !== "DESACTIVADO");
  const high = active.filter(row => riskLevel(row.prediccion_churn) === "ALTO");
  const cards = [
    ["Alertas activas de alto riesgo", high.length],
    ["Riesgo medio activo", active.filter(row => riskLevel(row.prediccion_churn) === "MEDIO").length],
    ["Sin predicción activa", active.filter(row => !riskLevel(row.prediccion_churn)).length],
  ];
  return <div className="space-y-2">
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2" aria-busy={loading}>
      {cards.map(([label, value]) => <div key={label} className="rounded-xl border border-border bg-muted/20 px-3 py-2">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="text-xl font-bold">{loading || error ? "—" : value}</p>
      </div>)}
    </div>
    <p className="text-[10px] text-muted-foreground">Resumen de todos los seguimientos con los filtros de cabecera actuales.</p>
    {error && <p role="alert" className="text-xs text-destructive">No se pudo cargar el resumen. <button type="button" onClick={onRetry} className="underline">Reintentar</button></p>}
  </div>;
}
