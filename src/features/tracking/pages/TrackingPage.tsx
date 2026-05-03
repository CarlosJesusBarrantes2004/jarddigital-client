import { useAuth } from "@/features/auth/context/useAuth";
import { SeguimientoTable } from "../components/SeguimientoTable";
import { SeguimientoAsesorView } from "../components/SeguimientoAsesorView";

const ASESOR_ROLES = ["ASESOR"];

export function TrackingPage() {
  const { user } = useAuth();
  const roleCode = user?.rol?.codigo ?? "";

  const isAsesor = ASESOR_ROLES.includes(roleCode);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Page header */}
      <div className="px-6 py-4 border-b border-border shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-bold text-foreground tracking-tight">
            Módulo de Seguimiento
          </h1>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            {isAsesor
              ? "Tus ventas instaladas y su estado de seguimiento mensual"
              : "Gestión de seguimientos post-instalación · 6 meses por venta"}
          </p>
        </div>
      </div>

      {/* Dynamic view */}
      <div className="flex-1 overflow-hidden">
        {isAsesor ? <SeguimientoAsesorView /> : <SeguimientoTable />}
      </div>
    </div>
  );
}
