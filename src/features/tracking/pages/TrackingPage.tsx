import { useAuth } from "@/features/auth/context/useAuth";
import { SeguimientoTable } from "../components/SeguimientoTable";
import { SeguimientoAsesorView } from "../components/SeguimientoAsesorView";

const ASESOR_ROLES = ["ASESOR"];
const TABLE_ROLES = ["SEGUIMIENTO", "DUENO"];

export function TrackingPage() {
  const { user } = useAuth();
  const roleCode = user?.rol?.codigo ?? "";

  const isAsesor = ASESOR_ROLES.includes(roleCode);
  const canViewTable = TABLE_ROLES.includes(roleCode);

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
        {isAsesor ? (
          <SeguimientoAsesorView />
        ) : canViewTable ? (
          <SeguimientoTable></SeguimientoTable>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-2">
            <h2 className="text-[16px] font-bold text-foreground">
              Acceso Restringido
            </h2>
            <p className="text-[13px] text-muted-foreground">
              No tienes los permisos necesarios para visualizar la tabla global
              de seguimientos.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
