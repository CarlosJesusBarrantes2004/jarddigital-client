import { Navigate, Outlet } from "react-router-dom";
import { Sidebar } from "@/components/sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { useAuth } from "@/features/auth/hooks/useAuth";

export const MainLayout = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading)
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary border-opacity-50"></div>
          <p className="text-slate-500 font-medium animate-pulse">
            Sincronizando con Jard Digital...
          </p>
        </div>
      </div>
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

      {/* Contenido dinámico (Aquí se renderizará el Dashboard) */}
      <main className="pt-20 pl-0 lg:pl-64">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
