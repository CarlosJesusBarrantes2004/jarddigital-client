import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useSyncPredictions } from "../churn";
import type { NivelRiesgo } from "../types";

export function RetentionControls({ risk, descending, onChange }: { risk: NivelRiesgo | ""; descending: boolean; onChange: (risk: NivelRiesgo | "", descending: boolean) => void }) {
  const sync = useSyncPredictions();
  return <div className="flex flex-wrap items-center gap-3">
    <select aria-label="Filtrar por riesgo IA" value={risk} onChange={e => onChange(e.target.value as NivelRiesgo | "", descending)} className="h-8 rounded-lg border border-border bg-background px-2 text-xs">
      <option value="">Todos los Riesgos</option><option value="ALTO">Riesgo Alto</option><option value="MEDIO">Riesgo Medio</option><option value="BAJO">Riesgo Bajo</option>
    </select>
    <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={descending} onChange={e => onChange(risk, e.target.checked)} />Ordenar por Mayor Riesgo</label>
    <button type="button" disabled={sync.isPending} onClick={() => sync.mutate(undefined, {
      onSuccess: () => toast.success("Sincronización de predicciones solicitada correctamente."),
      onError: () => toast.error("No se pudieron sincronizar las predicciones. Intenta nuevamente."),
    })} className="flex items-center gap-2 rounded-lg border border-border px-3 h-8 text-xs disabled:opacity-50">
      {sync.isPending ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
      {sync.isPending ? "Sincronizando..." : "Sincronizar Predicciones"}
    </button>
  </div>;
}
