import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/sidebar";
import { DashboardHeader } from "@/components/dashboard-header";

export const MainLayout = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const currentUser = sessionStorage.getItem("currentUser");
    const currentBranch = sessionStorage.getItem("currentBranch");
    const currentModality = sessionStorage.getItem("currentModality");

    // Validación de sesión para proteger el sistema
    if (!currentUser || !currentBranch || !currentModality) {
      navigate("/auth/login");
      return;
    }

    setUser(JSON.parse(currentUser));
    setIsLoading(false);
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground animate-pulse">
          Cargando sistema...
        </p>
      </div>
    );
  }

  // Mapeo de roles para el Header
  const roleMap: Record<string, string> = {
    Asesor: "advisor",
    BackOffice: "back_office",
    Supervisor: "manager",
    Dueño: "admin",
  };

  const role = roleMap[user?.rol_sistema] || "advisor";

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <DashboardHeader
        userName={user?.nombre_completo}
        userRole={role as any}
      />

      {/* Contenido dinámico (Aquí se renderizará el Dashboard) */}
      <main className="pt-20 pl-0 lg:pl-64">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
