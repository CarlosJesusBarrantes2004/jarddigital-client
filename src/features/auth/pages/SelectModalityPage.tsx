import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, LogOut, MapPin, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface BranchData {
  id: number;
  nombre: string;
}

interface UserData {
  id: number;
  nombre_completo: string;
  modalidades: string[];
}

export const SelectModalityPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [branch, setBranch] = useState<BranchData | null>(null);
  const [selectedModality, setSelectedModality] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const pendingUser = sessionStorage.getItem("pendingUser");
    const currentBranch = sessionStorage.getItem("currentBranch");

    if (!pendingUser || !currentBranch) {
      navigate("/login");
      return;
    }

    setUser(JSON.parse(pendingUser));
    setBranch(JSON.parse(currentBranch));
  }, [navigate]);

  const handleSelectModality = async (modality: string) => {
    setSelectedModality(modality);
    setIsLoading(true);

    // Simulación de delay para feedback visual
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (user) {
      // Proceso de finalización de Login
      sessionStorage.removeItem("pendingUser");
      sessionStorage.setItem("currentUser", JSON.stringify(user));
      sessionStorage.setItem("currentModality", modality);

      // Ir al sistema principal
      navigate("/dashboard");
    }

    setIsLoading(false);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("pendingUser");
    sessionStorage.removeItem("currentBranch");
    navigate("/login");
  };

  const getModalityInfo = (modality: string) => {
    if (modality === "CALL") {
      return {
        title: "Centro de Llamadas",
        description: "Gestión de ventas a través de llamadas telefónicas",
        icon: Phone,
        color: "text-blue-600",
        bgColor: "bg-blue-50 border-blue-200",
        badgeColor: "bg-blue-100 text-blue-800",
      };
    } else {
      return {
        title: "Ventas de Campo",
        description: "Gestión de ventas en terreno y visitas a domicilio",
        icon: MapPin,
        color: "text-green-600",
        bgColor: "bg-green-50 border-green-200",
        badgeColor: "bg-green-100 text-green-800",
      };
    }
  };

  if (!user || !branch) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground animate-pulse">
          Cargando modalidades...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Phone className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-primary mb-2">
            Seleccionar Modalidad
          </h1>
          <p className="text-muted-foreground">
            Sucursal:{" "}
            <span className="font-semibold text-foreground">
              {branch.nombre}
            </span>
          </p>
          <p className="text-muted-foreground mt-1">
            Elige la modalidad de trabajo para continuar
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {user.modalidades.map((modality) => {
            const info = getModalityInfo(modality);
            const Icon = info.icon;

            return (
              <Card
                key={modality}
                onClick={() => !isLoading && handleSelectModality(modality)}
                className={`p-6 cursor-pointer transition-all duration-200 border-2 ${
                  selectedModality === modality
                    ? `border-primary ${info.bgColor} ring-2 ring-primary ring-offset-2`
                    : `border-transparent hover:border-primary/30 hover:${info.bgColor}`
                } ${isLoading && selectedModality !== modality ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${info.bgColor}`}>
                    <Icon className={`w-6 h-6 ${info.color}`} />
                  </div>
                  {selectedModality === modality && (
                    <div>
                      {isLoading ? (
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <ArrowRight className="w-6 h-6 text-primary" />
                      )}
                    </div>
                  )}
                </div>

                <h3 className="text-lg font-semibold text-foreground mb-1">
                  {info.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-snug">
                  {info.description}
                </p>

                <div
                  className={`mt-4 inline-block px-3 py-1 rounded-full text-xs font-semibold ${info.badgeColor}`}
                >
                  {modality === "CALL"
                    ? "Modalidad Telefónica"
                    : "Modalidad Presencial"}
                </div>
              </Card>
            );
          })}
        </div>

        <Card className="p-4 bg-primary/5 border-primary/20 mb-8 text-center text-xs text-slate-500">
          Tienes acceso a {user.modalidades.length} modalidades en esta sede.
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
