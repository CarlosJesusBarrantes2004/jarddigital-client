import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye } from "lucide-react";

// Componentes UI
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Componentes de Feature
import { SalesForm } from "../components/SalesForm";
import { SalesTable } from "../components/SalesTable";
import { useAuth } from "@/features/auth/context/useAuth";

// Tipos
interface Venta {
  id: number;
  cliente_nombre: string;
}

type ViewType = "list" | "form";

export const SalesPage = () => {
  const navigate = useNavigate();

  // 1. REEMPLAZO: Usamos el estado global en lugar de sessionStorage manual
  const { user, currentModality, loading } = useAuth();
  const [view, setView] = useState<ViewType>("list");

  // 2. PROTECCIÓN: Solo redirigimos si ya terminó de cargar y no hay usuario
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth/login");
    }
  }, [user, loading, navigate]);

  // Handlers
  const handleViewDetails = (sale: Venta) => {
    console.log("Ver detalles:", sale);
  };

  const handleEdit = (sale: Venta) => {
    console.log("Editar venta:", sale);
    setView("form");
  };

  const handleDelete = (id: number) => {
    if (confirm("¿Está seguro de que desea eliminar esta venta?")) {
      console.log("Eliminar venta:", id);
    }
  };

  // 3. RENDERIZADO DE CARGA: Usamos el loading del contexto
  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-muted-foreground animate-pulse">
          Cargando gestión de ventas...
        </p>
      </div>
    );
  }

  // Mapeo de roles basado en tu User Interface real
  // Asumiendo que user.rol.nombre trae "Asesor", "Supervisor", etc.
  const userRoleName = user.rol?.nombre || "Asesor";

  const roleMap: Record<string, string> = {
    Asesor: "advisor",
    BackOffice: "backoffice",
    Supervisor: "supervisor",
    Dueño: "owner",
    RRHH: "hr",
  };

  const role = roleMap[userRoleName] || "advisor";

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
      case "hr":
        return "Visualiza ventas para análisis de personal";
      default:
        return "Gestión de ventas";
    }
  };

  const canCreateSale = [
    "advisor",
    "backoffice",
    "supervisor",
    "owner",
  ].includes(role);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Gestión de Ventas
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-muted-foreground">{getRoleLabel()}</span>
            {/* Mostrar modalidad actual si existe */}
            {currentModality && (
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                {/* Manejo seguro si es objeto o string */}
                {typeof currentModality === "string"
                  ? currentModality
                  : currentModality?.name || ""}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant={view === "list" ? "default" : "outline"}
            onClick={() => setView("list")}
            className={view === "list" ? "bg-primary hover:bg-primary/90" : ""}
          >
            <Eye className="w-4 h-4 mr-2" />
            Ver Listado
          </Button>
          {canCreateSale && (
            <Button
              variant={view === "form" ? "default" : "outline"}
              onClick={() => setView("form")}
              className={
                view === "form" ? "bg-primary hover:bg-primary/90" : ""
              }
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Venta
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {view === "form" && canCreateSale ? (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
          <Card className="p-6 bg-primary/5 border-primary/20">
            <h2 className="text-xl font-bold text-primary">
              Registrar Nueva Venta
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Completa el formulario con todos los detalles de la venta. Los
              campos con asterisco (*) son obligatorios.
            </p>
          </Card>
          <SalesForm />
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Statistics */}
          <Card className="p-6 shadow-sm">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-foreground">
                  Estadísticas Rápidas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-muted-foreground">
                      Ventas Instaladas
                    </p>
                    <p className="text-2xl font-bold text-green-600 mt-2">8</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-muted-foreground">
                      En Ejecución
                    </p>
                    <p className="text-2xl font-bold text-blue-600 mt-2">3</p>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm text-muted-foreground">Pendientes</p>
                    <p className="text-2xl font-bold text-yellow-600 mt-2">2</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Sales Table Section */}
          <div className="space-y-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <h2 className="text-xl font-bold">Registro de Ventas</h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Buscar por cliente..."
                  className="px-3 py-2 border border-input rounded-md text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all w-full md:w-64"
                />
              </div>
            </div>

            <SalesTable
              role={role}
              onViewDetails={handleViewDetails}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>
        </div>
      )}
    </div>
  );
};
