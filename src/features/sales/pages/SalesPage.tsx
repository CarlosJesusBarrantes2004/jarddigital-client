import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Eye, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SalesForm } from "../components/SalesForm";
import { SalesTable } from "../components/SalesTable";

interface Venta {
  id: number;
  cliente_nombre: string;
  // ... otros campos
}

type ViewType = "list" | "form";

function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className={`p-4 rounded-lg border ${color}`}>
      <p className="text-sm opacity-80">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

export const SalesPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [view, setView] = useState<ViewType>("list");
  const [modality, setModality] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const currentUser = sessionStorage.getItem("currentUser");
    const currentModality = sessionStorage.getItem("currentModality");

    if (!currentUser || !currentModality) {
      navigate("/login");
      return;
    }

    setUser(JSON.parse(currentUser));
    setModality(currentModality);
    setIsLoading(false);
  }, [navigate]);

  if (isLoading || !user || !modality) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-muted-foreground animate-pulse">
          Cargando gestión de ventas...
        </p>
      </div>
    );
  }

  // Mapeo de roles igual al Dashboard para mantener coherencia
  const roleMap: Record<string, string> = {
    Asesor: "advisor",
    BackOffice: "backoffice",
    Supervisor: "supervisor",
    Dueño: "owner",
    RRHH: "hr",
  };

  const role = roleMap[user.rol_sistema || "Asesor"];

  const getRoleLabel = () => {
    switch (role) {
      case "advisor":
        return "Registra y visualiza tus ventas";
      case "backoffice":
        return "Administra y revisa todas las ventas";
      case "supervisor":
        return "Supervisa todas las ventas del equipo";
      case "owner":
        return "Control total del sistema de ventas";
      default:
        return "Gestión de ventas";
    }
  };

  // Permisos: Solo asesores, supervisores y dueños pueden crear
  const canCreateSale = ["advisor", "supervisor", "owner"].includes(role);

  return (
    <div className="space-y-6">
      {/* Header de la Página */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Gestión de Ventas
          </h1>
          <p className="text-muted-foreground mt-2">{getRoleLabel()}</p>
        </div>

        <div className="flex gap-2">
          <Button
            variant={view === "list" ? "default" : "outline"}
            onClick={() => setView("list")}
          >
            <Eye className="w-4 h-4 mr-2" />
            Ver Listado
          </Button>
          {canCreateSale && (
            <Button
              variant={view === "form" ? "default" : "outline"}
              onClick={() => setView("form")}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Venta
            </Button>
          )}
        </div>
      </div>

      {/* Contenido Dinámico: Formulario o Tabla */}
      {view === "form" && canCreateSale ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Card className="p-6 bg-primary/5 border-primary/20">
            <h2 className="text-xl font-bold text-primary">
              Registrar Nueva Venta
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Completa los detalles del cliente y el producto para JARD DIGITAL.
            </p>
          </Card>
          <SalesForm></SalesForm>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Mini Estadísticas de Ventas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatBox
              label="Instaladas"
              value="8"
              color="bg-green-50 text-green-600 border-green-200"
            />
            <StatBox
              label="En Ejecución"
              value="3"
              color="bg-blue-50 text-blue-600 border-blue-200"
            />
            <StatBox
              label="Pendientes"
              value="2"
              color="bg-yellow-50 text-yellow-600 border-yellow-200"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Registro Reciente</h2>
              <input
                type="text"
                placeholder="Buscar por cliente..."
                className="px-3 py-2 border rounded-md text-sm bg-white w-full max-w-xs focus:ring-2 focus:ring-primary outline-none transition-all"
              />
            </div>
            {/* Tabla de Ventas (Componente Externo) */}
            <SalesTable role={role} />
          </div>
        </div>
      )}
    </div>
  );
};
