// features/sales/pages/SalesPage.tsx
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Search, Plus, TrendingUp, CheckCircle2, Loader2 } from "lucide-react";
import { SalesTable } from "../components/SalesTable";
import { NewSaleForm } from "../components/NewSaleForm";
import { BackofficeForm } from "../components/BackOfficeForm";
import { SaleDetailViewer } from "../components/SaleDetailViewer"; // IMPORTANTE
import { useSales } from "../hooks/useSales";
import { useAuth } from "@/features/auth/context/useAuth"; // Hook de Auth

export const SalesPage = () => {
  const { user } = useAuth();
  const {
    ventas,
    loading,
    productos,
    grabadores,
    estadosSOT,
    createVenta,
    updateBackoffice,
  } = useSales();

  const [saleToClone, setSaleToClone] = useState<any | null>(null);

  const userRoleCode = user?.rol?.codigo || "ASESOR";
  // Regla: Backoffice, Dueño y Supervisor pueden gestionar ventas.
  const canManage = ["BACKOFFICE", "DUENO", "SUPERVISOR"].includes(
    userRoleCode,
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [sheetType, setSheetType] = useState<"nueva" | "gestion" | "ver">(
    "nueva",
  );
  const [selectedVenta, setSelectedVenta] = useState<any | null>(null);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );

  const metricas = {
    total: ventas.length,
    instaladas: ventas.filter(
      (v) => v.nombre_estado === "ATENDIDO" || v.nombre_estado === "CONFORME",
    ).length,
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Gestión de Ventas</h1>
        <p className="text-slate-600 mt-1">
          {canManage
            ? "Gestiona las ventas operativas del equipo."
            : "Visualiza tus ventas ingresadas."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6 bg-white border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">
                Ventas Totales
              </p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {metricas.total}
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-blue-200" />
          </div>
        </Card>
        <Card className="p-6 bg-white border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Instaladas</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {metricas.instaladas}
              </p>
            </div>
            <CheckCircle2 className="w-12 h-12 text-green-200" />
          </div>
        </Card>
      </div>

      <Card className="p-4 bg-white border-slate-200">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por DNI o Nombre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Ocultamos el botón "Nueva Venta" al BackOffice puro si así lo deseas, o lo dejas. Asumo que todos pueden crear. */}
          <Button
            onClick={() => {
              setSaleToClone(null);
              setSheetType("nueva");
              setIsSheetOpen(true);
            }}
            className="bg-primary"
          >
            <Plus className="w-4 h-4 mr-2" /> Nueva Venta
          </Button>
        </div>
      </Card>

      <SalesTable
        ventas={ventas.filter(
          (v) =>
            v.cliente_nombre
              .toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            v.cliente_numero_doc.includes(searchQuery),
        )}
        userRole={userRoleCode}
        onAction={(venta, action) => {
          setSelectedVenta(venta);

          // MAGIA DEL ENRUTAMIENTO LOCAL
          if (action === "clonar") {
            setSaleToClone(venta);
            setSheetType("nueva"); // Usamos el form de Nueva Venta, pero pasándole datos
          } else {
            setSaleToClone(null);
            setSheetType(action as "gestion" | "ver");
          }

          setIsSheetOpen(true);
        }}
      />

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent
          side="right"
          className="w-full md:w-[500px] overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle>
              {sheetType === "nueva"
                ? "Nueva Venta"
                : sheetType === "gestion"
                  ? "Gestión Operativa SOT"
                  : "Detalle de Venta"}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            {sheetType === "nueva" && (
              <>
                {/* Aviso visual si es un clon */}
                {saleToClone && (
                  <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800">
                    <span className="font-bold">Modo Reingreso:</span> Revisa
                    los datos pre-llenados, asigna un nuevo grabador de audio y
                    guarda para generar la nueva venta.
                  </div>
                )}
                <NewSaleForm
                  productos={productos}
                  grabadores={grabadores}
                  initialData={saleToClone} // <-- Pasamos la data clonada
                  onSave={createVenta}
                  onClose={() => setIsSheetOpen(false)}
                />
              </>
            )}
            {sheetType === "gestion" && selectedVenta && (
              <BackofficeForm
                venta={selectedVenta}
                estadosSOT={estadosSOT}
                onSave={(data) => updateBackoffice(selectedVenta.id, data)}
                onClose={() => setIsSheetOpen(false)}
              />
            )}
            {sheetType === "ver" && selectedVenta && (
              <SaleDetailViewer venta={selectedVenta} />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
