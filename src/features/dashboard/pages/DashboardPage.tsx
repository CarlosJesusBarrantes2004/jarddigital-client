// import { useAuth } from "@/features/auth/context/useAuth";
// import { QuickActions } from "../components/QuickActions";
// import { StatGrid } from "../components/StatGrid";
// import { SystemStatus } from "../components/SystemStatus";

export const DashboardPage = () => {
  // const { user } = useAuth();
  // const isOwner = user?.rol.codigo === "DUENO";

  // const branchRaw = sessionStorage.getItem("currentBranch");
  /*const branchData = branchRaw
    ? JSON.parse(branchRaw)
    : { name: "Todas las Sedes" };*/

  // const modalityRaw = sessionStorage.getItem("currentModality");
  // const modality = modalityRaw ? JSON.parse(modalityRaw) : { name: "GLOBAL" };

  /*const modalityDisplay =
    modality.name === "CALL CENTER"
      ? "Centro de Llamadas"
      : modality.name === "GLOBAL"
        ? "Acceso Total"
        : "Ventas de Campo";*/

  return (
    <div className="flex flex-col items-center justify-center h-[60vh] animate-in fade-in duration-500 space-y-4 text-center">
      <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-4">
        <span className="text-3xl">🛠️</span>
      </div>
      <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
        Proximamente, nuevos detalles
      </h1>
      <p className="text-muted-foreground font-medium text-lg">PD: Carlos</p>
    </div>
  );
};
