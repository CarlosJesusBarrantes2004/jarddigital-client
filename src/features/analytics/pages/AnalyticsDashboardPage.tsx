import { useState } from "react";
import { MatrizPivote } from "../components/MatrizPivote";
import { BarrasRendimientoMes } from "../components/BarrasRendimientoMes";
import { EvolucionMensualAsesores } from "../components/EvolucionMensualAsesores";
import { TendenciaDiariaComparativa } from "../components/TendenciaDiariaComparativa";
import { ArbolJerarquico } from "../components/ArbolJerarquico";
import { RetencionPagos } from "../components/RetencionPagos";

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

      <div
        className={`grid grid-cols-1 ${hayMuchosAsesores ? "" : "xl:grid-cols-2"} gap-5`}
      >
        {/* Aquí tus componentes de barras y evolución asumiendo que ya soportan el anio */}
        <BarrasRendimientoMes />
        <EvolucionMensualAsesores onMuchosAsesores={setHayMuchosAsesores} />
      </div>

      <TendenciaDiariaComparativa />

      {/* AQUÍ VA EL NUEVO GRÁFICO DE RETENCIÓN */}
      <RetencionPagos />

      <MatrizPivote />
      <ArbolJerarquico />
    </div>
  );
};
