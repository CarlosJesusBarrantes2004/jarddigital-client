import { useMemo, useState } from "react";
import { Search, Plus, TrendingUp, CheckCircle2, Clock } from "lucide-react";

import { Card } from "@/components/ui/card";
import { GlobalLoader } from "@/components/GlobalLoader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/features/auth/context/useAuth";

import { useSales } from "../hooks/useSales";
import { SalesTable } from "../components/SalesTable";
import { NewSaleForm } from "../components/NewSaleForm";
import { BackofficeForm } from "../components/BackOfficeForm";
import { SaleDetailViewer } from "../components/SaleDetailViewer";

export const SalesPage = () => {
  const { user } = useAuth();
  const {
    sales,
    loading,
    products,
    engravers,
    sotStates,
    audioStates,
    createSale,
    updateBackoffice,
  } = useSales();

  const userRoleCode = user?.rol.codigo || "ASESOR";
  const canManage = ["BACKOFFICE", "DUENO", "SUPERVISOR"].includes(
    userRoleCode,
  );
  const isBackoffice = userRoleCode === "BACKOFFICE";

  const [searchQuery, setSearchQuery] = useState("");
  const [filterSotStates, setFilterSotStates] = useState<string>("TODOS");

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [sheetType, setSheetType] = useState<"nueva" | "gestion" | "ver">(
    "nueva",
  );
  const [selectedSale, setSelectedSale] = useState<any | null>(null);
  const [saleToClone, setSaleToClone] = useState<any | null>(null);

  const metrics = useMemo(
    () => ({
      total: sales.length,
      pending: sales.filter(
        (s) => s.codigo_estado === "EJECUCION" || !s.codigo_estado,
      ).length,
      installed: sales.filter((s) =>
        ["ATENDIDO"].includes(s.codigo_estado || ""),
      ).length,
    }),
    [sales],
  );

  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const matchQuery =
        s.cliente_nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.cliente_numero_doc.includes(searchQuery);

      const matchState =
        filterSotStates === "TODOS" || s.nombre_estado === filterSotStates;

      return matchQuery && matchState;
    });
  }, [sales, searchQuery, filterSotStates]);

  if (loading) return <GlobalLoader message="Analizando datos de ventas..." />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Registro de Ventas
        </h1>
        <p className="text-slate-500 mt-1 font-medium text-sm sm:text-base">
          {canManage
            ? "Panel de control operativo y gestión SOT/SEC."
            : "Historial de tus ventas ingresadas."}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 bg-white border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                Total Ingresadas
              </p>
              <p className="text-3xl font-bold text-blue-600 mt-1">
                {metrics.total}
              </p>
            </div>
            <TrendingUp className="w-10 h-10 text-blue-100" />
          </div>
        </Card>

        <Card className="p-5 bg-white border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                Pendientes Gestión
              </p>
              <p className="text-3xl font-bold text-yellow-500 mt-1">
                {metrics.pending}
              </p>
            </div>
            <Clock className="w-10 h-10 text-yellow-100" />
          </div>
        </Card>

        <Card className="p-5 bg-white border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                Completadas
              </p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {metrics.installed}
              </p>
            </div>
            <CheckCircle2 className="w-10 h-10 text-green-100" />
          </div>
        </Card>
      </div>

      <Card className="p-4 bg-white border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="flex flex-1 gap-3">
            <div className="relative flex-1 md:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar cliente, DNI..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 border-slate-200 bg-slate-50/50"
              />
            </div>

            {canManage && (
              <div className="w-40 hidden sm:block">
                <Select
                  value={filterSotStates}
                  onValueChange={setFilterSotStates}
                >
                  <SelectTrigger className="border-slate-200 bg-slate-50/50">
                    <SelectValue placeholder="Filtrar Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos los Estados</SelectItem>
                    {sotStates.map((e) => (
                      <SelectItem key={e.id} value={e.nombre}>
                        {e.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {!isBackoffice && (
            <Button
              onClick={() => {
                setSaleToClone(null);
                setSheetType("nueva");
                setIsSheetOpen(true);
              }}
              className="bg-primary hover:bg-primary/90 text-white font-medium shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" /> Nueva Venta
            </Button>
          )}
        </div>
      </Card>

      <SalesTable
        ventas={filteredSales}
        userRole={userRoleCode}
        onAction={(sale, action) => {
          setSelectedSale(sale);
          if (action === "clonar") {
            setSaleToClone(sale);
            setSheetType("nueva");
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
          className="w-full sm:max-w-xl overflow-y-auto border-l shadow-2xl p-0"
        >
          <div className="px-6 py-6 border-b bg-slate-50/80 sticky top-0 z-10 backdrop-blur-sm">
            <SheetTitle className="text-2xl text-slate-800">
              {sheetType === "nueva"
                ? saleToClone
                  ? "Reingreso de Venta"
                  : "Nueva Venta"
                : sheetType === "gestion"
                  ? "Gestión Operativa SOT"
                  : "Detalle del Cliente"}
            </SheetTitle>
            <SheetDescription className="text-slate-500 mt-1">
              {sheetType === "nueva"
                ? "Completa los datos requeridos para procesar la transacción."
                : sheetType === "gestion"
                  ? "Asigna códigos y fechas para la instalación."
                  : "Vista de solo lectura del expediente comercial."}
            </SheetDescription>
          </div>

          <div className="p-6">
            {sheetType === "nueva" && (
              <>
                {saleToClone && (
                  <div className="mb-6 p-4 bg-orange-50 border-l-4 border-orange-400 rounded-r-lg text-sm text-orange-800 animate-in fade-in">
                    <span className="font-bold block text-orange-900 mb-1">
                      Modo Clonación Activo
                    </span>
                    Los datos del cliente han sido pre-cargados. Asigne un nuevo
                    grabador y guarde.
                  </div>
                )}
                <NewSaleForm
                  products={products}
                  engravers={engravers}
                  initialData={saleToClone}
                  onSave={createSale}
                  onClose={() => setIsSheetOpen(false)}
                />
              </>
            )}

            {sheetType === "gestion" && selectedSale && (
              <BackofficeForm
                sale={selectedSale}
                sotStates={sotStates}
                audioStates={audioStates}
                onSave={(data) => updateBackoffice(selectedSale.id, data)}
                onClose={() => setIsSheetOpen(false)}
              />
            )}

            {sheetType === "ver" && selectedSale && (
              <SaleDetailViewer sale={selectedSale} />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
