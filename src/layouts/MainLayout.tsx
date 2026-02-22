import { Navigate, Outlet } from "react-router-dom";
import { Sidebar } from "@/components/sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { useAuth } from "@/features/auth/context/useAuth";
import { GlobalLoader } from "@/components/GlobalLoader";

export const MainLayout = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading)
    return (
      <GlobalLoader message="Sincronizando con Jard Digital..."></GlobalLoader>
    );

  if (!isAuthenticated) return <Navigate to={"/auth/login"} replace></Navigate>;

  const userRole = user?.rol?.nombre || "Asesor";

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <DashboardHeader
        userName={user?.nombre_completo || "Usuario"}
        userRole={userRole as any}
      />
      <main className="pt-20 pl-0 lg:pl-64">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
