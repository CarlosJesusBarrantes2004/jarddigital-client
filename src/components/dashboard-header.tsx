import { useState } from "react";
import { NotificationsPanel } from "./notifications-panel";
import { User, Settings } from "lucide-react";

interface DashboardHeaderProps {
  userRole?: "advisor" | "back_office" | "manager" | "admin";
  userName?: string;
}

export const DashboardHeader = ({
  userRole = "advisor",
  userName = "Usuario",
}: DashboardHeaderProps) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "advisor":
        return "Asesor de Ventas";
      case "back_office":
        return "Back Office";
      case "manager":
        return "Gerente";
      case "admin":
        return "Administrador";
      default:
        return "Usuario";
    }
  };

  return (
    <header className="fixed top-0 right-0 h-20 left-0 lg:left-64 bg-card border-b border-border flex items-center justify-between px-6 z-30">
      <div>
        <p className="text-sm text-muted-foreground">Bienvenido</p>
        <h1 className="text-xl font-bold text-foreground">{userName}</h1>
      </div>

      <div className="flex items-center gap-4">
        <span className="hidden sm:inline px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
          {getRoleLabel(userRole)}
        </span>

        <NotificationsPanel />

        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold">
              {userName.charAt(0).toUpperCase()}
            </div>
          </button>

          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 top-12 w-48 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
                <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left">
                  <User className="w-4 h-4" />
                  <span>Mi Perfil</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left border-t border-border">
                  <Settings className="w-4 h-4" />
                  <span>Configuración</span>
                </button>
                <button className="w-full px-4 py-3 hover:bg-destructive/10 transition-colors text-left border-t border-border text-destructive text-sm font-medium">
                  Cerrar Sesión
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
