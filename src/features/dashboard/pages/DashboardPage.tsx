import { useAuth } from "@/features/auth/context/useAuth";
import { AnalyticsDashboardPage } from "@/features/analytics/pages/AnalyticsDashboardPage";
import { ResumenAsesorMensual } from "../components/ResumenAsesorMensual";

export const DashboardPage = () => {
  const { user } = useAuth();
  const roleCode = user?.rol?.codigo;

  const renderDashboardContent = () => {
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

    // BACKOFFICE, RRHH, SEGUIMIENTO
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] animate-in fade-in duration-500 space-y-4 text-center">
        <p className="text-muted-foreground">
          No hay un panel analítico configurado para tu rol todavía.
        </p>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans animate-in fade-in duration-500">
      {/* --- RENDERIZADO DEL DASHBOARD ESPECÍFICO --- */}
      {renderDashboardContent()}
    </div>
  );
};
