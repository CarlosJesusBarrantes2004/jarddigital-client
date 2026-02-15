import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, MapPin } from "lucide-react";
import { BranchCard } from "../components/BranchCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "../context/useAuth";
import { Card } from "@/components/ui/card";

export const SelectBranchePage = () => {
  const navigate = useNavigate();
  const { user, selectBranch, logout } = useAuth();
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const pendingUserData = sessionStorage.getItem("pendingUser");
    if (!pendingUserData && !user) {
      navigate("/auth/login");
    }
  }, [navigate, user]);

  const handleSelectBranch = async (branchId: number) => {
    if (!user) return;

    setSelectedBranchId(branchId);
    setIsLoading(true);

    const branch = user.sucursales.find((b) => b.id_sucursal === branchId);

    if (branch) {
      selectBranch(branch);
      sessionStorage.removeItem("pendingUser");
      navigate("/dashboard");
    }

    setIsLoading(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-medium">Cargando sucursales...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <MapPin className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-primary mb-2">
            Seleccionar Sucursal
          </h1>
          <p className="text-muted-foreground">
            Hola{" "}
            <span className="font-semibold text-foreground">
              {user.nombre_completo}
            </span>
            , selecciona la sucursal a la que deseas acceder
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {user.sucursales.map((branch) => (
            <BranchCard
              id={branch.id_sucursal}
              nombre={branch.nombre_sucursal}
              isSelected={selectedBranchId === branch.id_sucursal}
              isLoading={isLoading}
              onClick={() => handleSelectBranch(branch.id_sucursal)}
            ></BranchCard>
          ))}
        </div>

        <Card className="p-6 bg-primary/5 border-primary/20 mb-8">
          <p className="text-sm text-muted-foreground">
            Tienes acceso a{" "}
            <span className="font-semibold text-primary">
              {user.sucursales.length}
            </span>{" "}
            sucursal{user.sucursales.length > 1 ? "es" : ""}. Selecciona una
            para continuar.
          </p>
        </Card>

        <Button
          variant="outline"
          onClick={logout}
          className="w-full h-12 border-destructive/30 text-destructive hover:bg-destructive/10 bg-transparent"
          disabled={isLoading}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Salir
        </Button>
      </div>
    </div>
  );
};
