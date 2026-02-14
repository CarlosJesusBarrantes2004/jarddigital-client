import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, UserPlus } from "lucide-react";

export const QuickActions = () => {
  return (
    <Card className="lg:col-span-2 p-6 border-none shadow-sm bg-white">
      <h2 className="text-xl font-bold text-slate-800 mb-6">
        Accesos Directos
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button className="h-auto p-4 justify-start bg-primary hover:bg-primary/90 transition-all group">
          <div className="bg-white/20 p-2 rounded-lg mr-4 group-hover:scale-110 transition-transform">
            <Plus className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <p className="font-bold text-white">Nueva Operación</p>
            <p className="text-xs text-primary-foreground/70">
              Registrar venta o contacto
            </p>
          </div>
        </Button>

        <Button
          variant="outline"
          className="h-auto p-4 justify-start border-slate-200 hover:bg-slate-50 transition-all group"
        >
          <div className="bg-slate-100 p-2 rounded-lg mr-4 group-hover:scale-110 transition-transform text-slate-600">
            <UserPlus className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p className="font-bold text-slate-800">Registrar Cliente</p>
            <p className="text-xs text-slate-500">Añadir a la base de datos</p>
          </div>
        </Button>
      </div>
    </Card>
  );
};
