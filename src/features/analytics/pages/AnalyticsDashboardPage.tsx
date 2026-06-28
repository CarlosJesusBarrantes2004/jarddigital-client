import { useState } from "react";
import { MatrizPivote } from "../components/MatrizPivote";
import { BarrasRendimientoMes } from "../components/BarrasRendimientoMes";
import { EvolucionMensualAsesores } from "../components/EvolucionMensualAsesores";
import { TendenciaDiariaComparativa } from "../components/TendenciaDiariaComparativa";
import { ArbolJerarquico } from "../components/ArbolJerarquico";

export const AnalyticsDashboardPage = () => {
  const [hayMuchosAsesores, setHayMuchosAsesores] = useState(false);

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-500">
      <div>
        <h1 className="text-[20px] font-bold text-foreground">
          Panel Analítico
        </h1>
        <p className="text-[13px] text-muted-foreground">
          Rendimiento comercial, tendencias y distribución por segmento.
        </p>
      </div>

      {/* Fila 1: barras del mes + evolución anual. Layout dinámico basado en estado */}
      <div className={`grid grid-cols-1 ${hayMuchosAsesores ? "" : "xl:grid-cols-2"} gap-5`}>
        <BarrasRendimientoMes />
        <EvolucionMensualAsesores onMuchosAsesores={setHayMuchosAsesores} />
      </div>

      {/* Fila 2: tendencia diaria comparativa, ancho completo */}
      <TendenciaDiariaComparativa />

      {/* Fila 3: matriz pivote, ancho completo (tabla scrolleable) */}
      <MatrizPivote />

      {/* Fila 4: árbol jerárquico, ancho completo */}
      <ArbolJerarquico />
    </div>
  );
};
