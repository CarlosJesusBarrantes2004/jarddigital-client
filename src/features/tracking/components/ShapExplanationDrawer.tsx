import { Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useShapPrediction } from "../churn";
import type { Seguimiento } from "../types";
import { RiskBadge } from "./RiskBadge";

export function ShapExplanationDrawer({ seguimiento, onClose }: { seguimiento: Seguimiento; onClose: () => void }) {
  const prediction = useShapPrediction(seguimiento.venta_id ?? seguimiento.venta.id);
  const factors = (prediction.data?.factores_shap ?? []).flatMap((factor, index) => {
    const impact = factor.valor_shap ?? factor.shap_value ?? factor.impacto;
    return typeof impact === "number" && Number.isFinite(impact) ? [{
      name: factor.variable ?? factor.feature ?? factor.factor ?? factor.nombre ?? `Factor ${index + 1}`,
      impact, value: factor.valor,
    }] : [];
  }).sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
  const max = Math.max(...factors.map(f => Math.abs(f.impact)), 0.001);
  return <Sheet open onOpenChange={open => { if (!open) onClose(); }}>
    <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
      <SheetHeader>
        <SheetTitle>Factores de riesgo (SHAP)</SheetTitle>
        <SheetDescription>{seguimiento.venta.cliente_nombre} · SOT {seguimiento.venta.codigo_sot}</SheetDescription>
      </SheetHeader>
      <div className="px-4 pb-6 space-y-5">
        {prediction.isPending ? <p role="status" className="flex items-center gap-2 text-sm"><Loader2 className="animate-spin" size={16} />Calculando explicación...</p> : prediction.isError ? <div role="alert" className="space-y-3 text-sm">
          <p>No se pudieron obtener los factores de riesgo.</p><button type="button" onClick={() => void prediction.refetch()} className="underline text-primary">Reintentar</button>
        </div> : <>
          <RiskBadge prediction={prediction.data} />
          {prediction.data.fecha_calculo && <p className="text-xs text-muted-foreground">Calculado: {new Date(prediction.data.fecha_calculo).toLocaleString("es-PE")}</p>}
          <p className="text-xs text-muted-foreground">Rojo: aumenta el riesgo de abandono. Verde: reduce el riesgo. Las contribuciones SHAP no son porcentajes de probabilidad.</p>
          {factors.length === 0 ? <p className="text-sm text-muted-foreground">La respuesta no incluye factores SHAP disponibles para graficar.</p> : <ul className="space-y-4">
            {factors.map((factor, index) => <li key={`${factor.name}-${index}`} className="space-y-1.5 text-xs">
              <div className="flex justify-between gap-3"><span className="break-words">{factor.name}{factor.value != null && `: ${factor.value}`}</span><span className="font-mono shrink-0">{factor.impact > 0 ? "+" : ""}{factor.impact.toFixed(4)}</span></div>
              <div className="relative flex h-3 rounded bg-muted overflow-hidden" aria-label={`${factor.name}: ${factor.impact > 0 ? "aumenta" : factor.impact < 0 ? "reduce" : "sin efecto sobre"} el riesgo, ${factor.impact}`}>
                <div className="absolute left-1/2 top-0 bottom-0 border-l border-foreground/30" />
                <div className={`absolute h-full ${factor.impact >= 0 ? "bg-red-500" : "bg-emerald-500"}`} style={{ width: `${Math.abs(factor.impact) / max * 50}%`, left: factor.impact >= 0 ? "50%" : undefined, right: factor.impact < 0 ? "50%" : undefined }} />
              </div>
            </li>)}
          </ul>}
        </>}
      </div>
    </SheetContent>
  </Sheet>;
}
