import { QuickActions } from "../components/QuickActions";
import { StatGrid } from "../components/StatGrid";
import { SystemStatus } from "../components/SystemStatus";

export const DashboardPage = () => {
  const branchData = JSON.parse(
    sessionStorage.getItem("currentBranch") || '{"nombre": "Sede Central"}',
  );

  const modalityRaw = sessionStorage.getItem("currentModality");
  const modality = modalityRaw ? JSON.parse(modalityRaw) : null;

  const modalityDisplay =
    modality.name === "CALL CENTER" ? "Centro de Llamadas" : "Ventas de Campo";

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Panel de Control
          </h1>
          <p className="text-slate-500 mt-1 font-medium">
            Gestión operativa para Jard Digital
          </p>
        </div>

        <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
              Sucursal Activa
            </span>
            <span className="text-sm font-bold text-primary">
              {branchData.nombre}
            </span>
          </div>
          <div className="h-8 w-[1px] bg-slate-100 mx-1"></div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
              Modalidad
            </span>
            <span className="text-sm font-bold text-slate-700">
              {modalityDisplay}
            </span>
          </div>
        </div>
      </div>

      <StatGrid></StatGrid>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <QuickActions></QuickActions>
        <SystemStatus></SystemStatus>
      </div>
    </div>
  );
};
