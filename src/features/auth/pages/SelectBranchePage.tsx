import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // CAMBIO: de next/navigation
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, LogOut, ArrowRight } from "lucide-react";

interface BranchOption {
  id: number;
  nombre: string;
}

interface UserData {
  id: number;
  nombre_completo: string;
  modalidades: string[];
  sucursales: BranchOption[];
}

export const SelectBranchePage = () => {
  const navigate = useNavigate(); // CAMBIO: useNavigate
  const [user, setUser] = useState<UserData | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const pendingUser = sessionStorage.getItem("pendingUser");
    if (!pendingUser) {
      navigate("/login");
      return;
    }
    setUser(JSON.parse(pendingUser));
  }, [navigate]);

  const handleSelectBranch = async (branchId: number) => {
    setSelectedBranch(branchId);
    setIsLoading(true);

    // Simulación de carga
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (user) {
      const selectedBranchData = user.sucursales.find((b) => b.id === branchId);
      if (selectedBranchData) {
        sessionStorage.setItem(
          "currentBranch",
          JSON.stringify(selectedBranchData),
        );

        if (user.modalidades.length > 1) {
          // Si tiene varias modalidades (CALL/CAMPO), va a la siguiente selección
          sessionStorage.setItem("pendingUser", JSON.stringify(user));
          navigate("/auth/select-modality");
        } else {
          // Si solo tiene una, entra directo al sistema
          sessionStorage.removeItem("pendingUser");
          sessionStorage.setItem("currentUser", JSON.stringify(user));
          sessionStorage.setItem("currentModality", user.modalidades[0]);
          navigate("/dashboard"); // CAMBIO: ruta a nuestro dashboard
        }
      }
    }
    setIsLoading(false);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("pendingUser");
    navigate("/login");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-slate-500">
        Cargando sucursales...
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
            , selecciona la sede para hoy:
          </p>
        </div>

        {/* Grid de Sucursales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {user.sucursales.map((branch) => (
            <Card
              key={branch.id}
              onClick={() => !isLoading && handleSelectBranch(branch.id)}
              className={`p-6 cursor-pointer transition-all duration-200 border-2 ${
                selectedBranch === branch.id
                  ? "border-primary bg-primary/5"
                  : "border-transparent hover:border-primary/30 hover:bg-primary/10"
              } ${isLoading && selectedBranch !== branch.id ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-primary mb-1">
                    {branch.nombre}
                  </h3>
                  <p className="text-sm text-muted-foreground italic">
                    Presiona para entrar
                  </p>
                </div>
                {selectedBranch === branch.id && (
                  <div className="ml-4">
                    {isLoading ? (
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <ArrowRight className="w-6 h-6 text-primary" />
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Info y Salida */}
        <Card className="p-4 bg-primary/5 border-primary/10 mb-8 text-center text-sm text-slate-500">
          Acceso autorizado para personal de Jard Digital
        </Card>

        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full text-destructive hover:bg-destructive/10"
          disabled={isLoading}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Cancelar y Salir
        </Button>
      </div>
    </div>
  );
};
