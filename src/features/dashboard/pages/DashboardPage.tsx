import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BarChart3, Phone, TrendingUp, Users } from "lucide-react";

function StatCard({ title, value, sub, icon, color = "" }: any) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">{title}</p>
          <p className="text-3xl font-bold text-primary mt-2">{value}</p>
          <p className={`text-xs mt-1 ${color || "text-muted-foreground"}`}>
            {sub}
          </p>
        </div>
        <div className="w-12 h-12 text-primary/20">{icon}</div>
      </div>
    </Card>
  );
}

export const DashboardPage = () => {
  const branch = JSON.parse(sessionStorage.getItem("currentBranch") || "{}");
  const modality = sessionStorage.getItem("currentModality");
  const modalityDisplay =
    modality === "CALL" ? "Centro de Llamadas" : "Ventas de Campo";

  return (
    <div className="space-y-6">
      {/* Título y Modalidad */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Bienvenido al sistema de Call Center Jard Digital
          </p>
        </div>
        <div className="mt-4 md:mt-0 inline-flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 border border-primary/20 w-fit">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-sm font-semibold text-primary">
            {modalityDisplay}
          </span>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground">
            {branch.nombre || "Sede Central"}
          </span>
        </div>
      </div>

      {/* Grid de Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Ventas Hoy"
          value="12"
          sub="+25% vs ayer"
          icon={<TrendingUp />}
          color="text-green-600"
        />
        <StatCard
          title="Llamadas"
          value="48"
          sub="Última hora"
          icon={<Phone />}
        />
        <StatCard
          title="Ingresos"
          value="$5,240"
          sub="+18% vs semana"
          icon={<BarChart3 />}
          color="text-green-600"
        />
        <StatCard
          title="Conversión"
          value="28%"
          sub="Meta: 30%"
          icon={<Users />}
        />
      </div>

      {/* Acciones Rápidas */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-primary mb-4">
          Acciones Rápidas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button className="bg-primary hover:bg-primary/90 h-auto p-4 flex flex-col items-start text-left">
            <span className="text-sm font-medium">Nueva Venta</span>
            <span className="text-xs text-primary-foreground/80 mt-1">
              Registra una venta nueva
            </span>
          </Button>
          {/* ... otros botones de v0 ... */}
        </div>
      </Card>
    </div>
  );
};
