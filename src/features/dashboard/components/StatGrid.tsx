import { BarChart3, Phone, TrendingUp, Users } from "lucide-react";
import { StatCard } from "./StatCard";

export const StatGrid = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Ventas del Día"
        value="12"
        sub="+25% vs promedio"
        icon={<TrendingUp className="w-6 h-6" />}
        color="text-emerald-600"
      />
      <StatCard
        title="Llamadas Realizadas"
        value="48"
        sub="Efectividad del 82%"
        icon={<Phone className="w-6 h-6" />}
      />
      <StatCard
        title="Recaudación"
        value="S/ 5,240"
        sub="+12.5% meta diaria"
        icon={<BarChart3 className="w-6 h-6" />}
        color="text-emerald-600"
      />
      <StatCard
        title="Leads Activos"
        value="156"
        sub="Pendientes de cierre"
        icon={<Users className="w-6 h-6" />}
      />
    </div>
  );
};
