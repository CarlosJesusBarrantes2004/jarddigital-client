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
      <p>Se agregará algo nuevo, muy muy pronto</p>
    </div>
  );
};
