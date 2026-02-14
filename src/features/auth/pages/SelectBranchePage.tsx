import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // CAMBIO: de next/navigation
import type { User } from "../types";
import { LayoutGrid, LogOut } from "lucide-react";
import { BranchCard } from "../components/BranchCard";
import { Button } from "@/components/ui/button";
import { authService } from "../services/authService";

export const SelectBranchePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const pendingUserData = sessionStorage.getItem("pendingUser");
    if (!pendingUserData) {
      navigate("/auth/login");
      return;
    }
    setUser(JSON.parse(pendingUserData));
  }, [navigate]);

  const handleSelectBranch = async (branchId: number) => {
    if (!user) return;

    setSelectedBranchId(branchId);
    setIsLoading(true);

    const selectedBranch = user.sucursales.find((b) => b.id === branchId);

    if (selectedBranch) {
      // 1. Guardamos la sede elegida para el Dashboard
      sessionStorage.setItem("currentBranch", JSON.stringify(selectedBranch));

      // 2. Establecemos modalidad por defecto si el backend no la envió aún
      // (Para 'carlos_test' pusimos modalidad 1 en la base de datos)
      sessionStorage.setItem("currentModality", "CALL CENTER");

      // 3. Confirmamos al usuario y limpiamos el estado pendiente
      sessionStorage.setItem("currentUser", JSON.stringify(user));
      sessionStorage.removeItem("pendingUser");

      navigate("/dashboard");
    }
    setIsLoading(false);
  };

  const handleLogout = async () => {
    setIsLoading(true);

    try {
      await authService.logout();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      sessionStorage.clear();
      navigate("/auth/login");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-slate-500">
        Cargando sucursales...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <LayoutGrid className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
            Selección de Sede
          </h1>
          <p className="text-slate-500 font-medium">
            Bienvenido,{" "}
            <span className="text-primary font-bold">
              {user.nombre_completo || user.username}
            </span>
            . Indica en qué sucursal operarás hoy:
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 mb-8">
          {user.sucursales.map((branch) => (
            <BranchCard
              key={branch.id}
              nombre={branch.nombre}
              isSelected={selectedBranchId === branch.id}
              isLoading={isLoading}
              onClick={() => handleSelectBranch(branch.id)}
            />
          ))}
        </div>

        <div className="flex flex-col gap-4 items-center">
          <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">
            Seguridad Jard Digital - Acceso Restringido
          </p>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
            disabled={isLoading}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cancelar y salir
          </Button>
        </div>
      </div>
    </div>
  );
};
