import type { NivelRiesgo, PrediccionChurn, Seguimiento } from "./types";

export function riskLevel(prediction?: PrediccionChurn | null): NivelRiesgo | null {
  const p = prediction?.probabilidad_churn;
  if (typeof p !== "number" || !Number.isFinite(p) || p < 0 || p > 1) return null;
  return p >= 0.7 ? "ALTO" : p >= 0.4 ? "MEDIO" : "BAJO";
}

export function selectByRisk(rows: Seguimiento[], risk: NivelRiesgo | "", descending: boolean) {
  const selected = rows.filter(row => !risk || row.prediccion_churn?.nivel_riesgo === risk);
  if (descending) selected.sort((a, b) =>
    (b.prediccion_churn?.probabilidad_churn || 0) -
    (a.prediccion_churn?.probabilidad_churn || 0));
  return selected;
}

