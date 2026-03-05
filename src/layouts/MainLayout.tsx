import { useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

// Ajusta a tu ruta
import { useAuth } from "@/features/auth/context/useAuth";
import { GlobalLoader } from "@/components/GlobalLoader";
import { Sidebar } from "@/components/sidebar";

export const MainLayout = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // El Layout es el dueño del estado del Sidebar para poder ajustar los márgenes
  const [expanded, setExpanded] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (isLoading)
    return <GlobalLoader message="Sincronizando con Jard Digital..." />;
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans transition-colors duration-300">
      {/* HEADER MÓVIL (Solo visible en pantallas pequeñas) */}
      <header className="lg:hidden h-[60px] bg-sidebar border-b border-sidebar-border flex items-center justify-between px-4 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center font-serif font-bold text-[14px] text-primary-foreground shadow-sm">
            J
          </div>
          <span className="font-serif text-[15px] font-bold tracking-tight">
            Jard Digital
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-sidebar-accent text-sidebar-foreground border border-sidebar-border shadow-sm active:scale-95 transition-all"
        >
          <Menu size={18} />
        </button>
      </header>

      {/* SIDEBAR COMPONENTE */}
      <Sidebar
        expanded={expanded}
        setExpanded={setExpanded}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* CONTENEDOR PRINCIPAL */}
      {/* La magia del margen dinámico:
        Si está expandido, el padding left (pl) es de 240px. 
        Si está colapsado, es de 72px.
        Todo esto se anima con duration-300.
      */}
      <main
        className={cn(
          "transition-[padding] duration-300 ease-in-out min-h-[calc(100vh-60px)] lg:min-h-screen",
          expanded ? "lg:pl-[240px]" : "lg:pl-[72px]",
        )}
      >
        <div className="p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
