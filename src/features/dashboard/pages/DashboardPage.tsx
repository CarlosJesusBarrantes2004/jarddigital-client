import { useState } from "react";
import { useAuth } from "@/features/auth/context/useAuth";
import { AnalyticsDashboardPage } from "@/features/analytics/pages/AnalyticsDashboardPage";
import { ResumenAsesorMensual } from "../components/ResumenAsesorMensual";
import { Calendar } from "lucide-react";

export const DashboardPage = () => {
  const { user } = useAuth();
  const roleCode = user?.rol?.codigo;

  // Estado global del año para todos los dashboards
  const anioActual = new Date().getFullYear();
  const [anio, setAnio] = useState<number>(anioActual);

  // Función para renderizar el componente adecuado según el rol
  const renderDashboardContent = () => {
    if (roleCode === "ASESOR") {
      return <ResumenAsesorMensual anio={anio} />;
    }

    if (
      roleCode === "DUENO" ||
      roleCode === "COORDINADOR" ||
      roleCode === "SUPERVISOR"
    ) {
      return <AnalyticsDashboardPage anio={anio} />;
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
      {/* --- CABECERA GLOBAL CON FILTRO DE AÑO --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border border-border p-5 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-serif tracking-tight">
            {roleCode === "ASESOR"
              ? "Mi Rendimiento Comercial"
              : "Consola Analítica y Control"}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {roleCode === "ASESOR"
              ? "Monitorea tus metas, comisiones logradas y métricas personales."
              : "Seguimiento y auditoría de KPIs operativos de la empresa."}
          </p>
        </div>

        {/* Selector de Año Fiscal */}
        <div className="flex items-center gap-2 bg-muted/30 p-1.5 rounded-xl border border-border">
          <Calendar size={16} className="text-muted-foreground ml-2" />
          <select
            value={anio}
            onChange={(e) => setAnio(Number(e.target.value))}
            className="h-9 bg-transparent border-none px-2 text-sm outline-none focus:ring-0 font-medium text-foreground cursor-pointer"
          >
            {/* Rango de años dinámico: Año anterior, actual y próximo */}
            {[anioActual - 1, anioActual, anioActual + 1].map((y) => (
              <option key={y} value={y}>
                Año Fiscal {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* --- RENDERIZADO DEL DASHBOARD ESPECÍFICO --- */}
      {renderDashboardContent()}
    </div>
  );
};
