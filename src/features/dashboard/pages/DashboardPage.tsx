import { useAuth } from "@/features/auth/context/useAuth";
import { AnalyticsDashboardPage } from "@/features/analytics/pages/AnalyticsDashboardPage";
import { ResumenAsesorMensual } from "../components/ResumenAsesorMensual";

export const DashboardPage = () => {
  const { user } = useAuth();
  const roleCode = user?.rol?.codigo;

  if (roleCode === "ASESOR") {
    return <ResumenAsesorMensual />;
  }

  if (
    roleCode === "DUENO" ||
    roleCode === "COORDINADOR" ||
    roleCode === "SUPERVISOR"
  ) {
    return <AnalyticsDashboardPage />;
  }

  // BACKOFFICE, RRHH, SEGUIMIENTO: sin panel analítico específico todavía
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] animate-in fade-in duration-500 space-y-4 text-center">
      <p className="text-muted-foreground">
        No hay un panel configurado para tu rol.
      </p>
    </div>
  );
};
