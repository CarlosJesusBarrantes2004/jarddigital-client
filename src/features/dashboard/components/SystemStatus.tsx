import { Card } from "@/components/ui/card";

export const SystemStatus = () => {
  return (
    <Card className="p-6 bg-slate-900 border-none shadow-xl">
      <h3 className="text-white font-bold mb-2">Estado del Sistema</h3>
      <p className="text-slate-400 text-sm mb-4">
        La conexión con el servidor de Chiclayo es estable.
      </p>
      <div className="space-y-4">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-tighter font-bold">
          <span className="text-slate-500">Última sincronización</span>
          <span className="text-primary">Hace 2 min</span>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div className="bg-primary w-full h-full animate-pulse"></div>
        </div>
        <div className="pt-2 border-t border-slate-800">
          <p className="text-[10px] text-slate-500">
            IP de acceso: 192.168.1.45
          </p>
        </div>
      </div>
    </Card>
  );
};
