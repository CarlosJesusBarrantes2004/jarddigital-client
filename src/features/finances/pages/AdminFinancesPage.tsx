import { useState, useEffect, useCallback } from "react";
import {
  Calculator,
  Calendar,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getPlanillas,
  ejecutarLiquidacionMasiva,
  extraerErrorFinanzas,
  getExportarPlanillasExcelUrl,
  type HistoricoPlanilla,
} from "../services/finances.api";
import { toast } from "sonner";

const MESES = [
  { valor: 1, nombre: "Enero" },
  { valor: 2, nombre: "Febrero" },
  { valor: 3, nombre: "Marzo" },
  { valor: 4, nombre: "Abril" },
  { valor: 5, nombre: "Mayo" },
  { valor: 6, nombre: "Junio" },
  { valor: 7, nombre: "Julio" },
  { valor: 8, nombre: "Agosto" },
  { valor: 9, nombre: "Septiembre" },
  { valor: 10, nombre: "Octubre" },
  { valor: 11, nombre: "Noviembre" },
  { valor: 12, nombre: "Diciembre" },
];

export const AdminFinancesPage = () => {
  const hoy = new Date();
  const [mes, setMes] = useState<number>(hoy.getMonth() + 1);
  const [anio, setAnio] = useState<number>(hoy.getFullYear());
  const [planillas, setPlanillas] = useState<HistoricoPlanilla[]>([]);
  const [isLoadingTable, setIsLoadingTable] = useState<boolean>(true);
  const [isLiquidating, setIsLiquidating] = useState<boolean>(false);

  const fetchPlanillas = useCallback(async () => {
    setIsLoadingTable(true);
    try {
      const data = await getPlanillas({ mes_fiscal: mes, anio_fiscal: anio });
      setPlanillas(data);
    } catch (error) {
      toast.error("Error de lectura");
    } finally {
      setIsLoadingTable(false);
    }
  }, [mes, anio]);

  useEffect(() => {
    fetchPlanillas();
  }, [fetchPlanillas]);

  const handleEjecutarLiquidacion = () => {
    const mesNombre = MESES.find((m) => m.valor === mes)?.nombre;
    toast.warning(`¿Liquidar mes de ${mesNombre} ${anio}?`, {
      description:
        "Esto calculará y guardará irreversiblemente el sueldo de todos los asesores activos. ¿Deseas continuar?",
      duration: 10000,
      action: {
        label: "Sí, ejecutar",
        onClick: async () => {
          setIsLiquidating(true);
          const toastId = toast.loading(
            "Calculando liquidaciones de toda la empresa...",
          );
          try {
            const respuesta = await ejecutarLiquidacionMasiva(mes, anio);
            toast.success("¡Liquidación Exitosa!", {
              id: toastId,
              description: respuesta.mensaje,
              duration: 4000,
            });
            fetchPlanillas();
          } catch (error) {
            toast.error("No se pudo liquidar", {
              id: toastId,
              description: extraerErrorFinanzas(error),
              duration: 6000,
            });
          } finally {
            setIsLiquidating(false);
          }
        },
      },
      cancel: { label: "Cancelar", onClick: () => toast.dismiss() },
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Calculator className="text-primary" /> Gestión de Planillas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visualiza el histórico de pagos o ejecuta el cálculo mensual de los
            asesores.
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 flex flex-col md:flex-row gap-4 items-end justify-between shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="flex flex-col gap-1.5 w-full md:w-40">
            <label className="text-[13px] font-medium text-muted-foreground flex items-center gap-1.5">
              <Calendar size={14} /> Mes Fiscal
            </label>
            <select
              value={mes}
              onChange={(e) => setMes(Number(e.target.value))}
              disabled={isLiquidating}
              className="h-10 bg-background border border-input rounded-md px-3 text-sm focus:ring-2 focus:ring-primary outline-none"
            >
              {MESES.map((m) => (
                <option key={m.valor} value={m.valor}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5 w-full md:w-32">
            <label className="text-[13px] font-medium text-muted-foreground">
              Año Fiscal
            </label>
            <select
              value={anio}
              onChange={(e) => setAnio(Number(e.target.value))}
              disabled={isLiquidating}
              className="h-10 bg-background border border-input rounded-md px-3 text-sm focus:ring-2 focus:ring-primary outline-none"
            >
              {[anio - 1, anio, anio + 1].map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto mt-4 md:mt-0">
          <a
            href={getExportarPlanillasExcelUrl(mes, anio)}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "h-10 px-4 rounded-md font-medium text-sm flex items-center justify-center gap-2 border border-border bg-card text-foreground hover:bg-muted shadow-sm transition-all whitespace-nowrap",
              (isLiquidating || planillas.length === 0) &&
                "pointer-events-none opacity-50",
            )}
          >
            <Download size={16} /> Exportar Excel
          </a>
          <button
            onClick={handleEjecutarLiquidacion}
            disabled={isLiquidating}
            className={cn(
              "h-10 px-6 rounded-md font-medium text-sm flex items-center justify-center gap-2 text-primary-foreground shadow-sm transition-all whitespace-nowrap",
              isLiquidating
                ? "bg-primary/70 cursor-not-allowed"
                : "bg-primary hover:bg-primary/90 hover:-translate-y-0.5",
            )}
          >
            {isLiquidating ? (
              <>
                <RefreshCw size={16} className="animate-spin" /> Procesando...
              </>
            ) : (
              <>
                <FileSpreadsheet size={16} /> Ejecutar Liquidación
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        {isLoadingTable ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <RefreshCw size={32} className="animate-spin text-primary mb-4" />
            <p className="text-sm font-medium">
              Cargando registros financieros...
            </p>
          </div>
        ) : planillas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <AlertCircle size={40} className="text-muted-foreground/50 mb-3" />
            <p className="text-base font-medium text-foreground">
              No hay liquidaciones para este mes
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-[11px] font-semibold tracking-wider">
                <tr>
                  <th className="px-4 py-3">Asesor</th>
                  <th className="px-4 py-3 text-center">
                    Ventas <br />
                    (Inst. / Pag.)
                  </th>
                  <th className="px-4 py-3 text-right">Sueldo Base</th>
                  <th className="px-4 py-3 text-right">
                    Comisión <br />
                    (% / Mult.)
                  </th>
                  <th className="px-4 py-3 text-right">Desc. Faltas</th>
                  <th className="px-4 py-3 text-right bg-primary/5 text-primary">
                    Neto a Pagar
                  </th>
                  <th className="px-4 py-3 text-center">Procesado por</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {planillas.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-foreground">
                      <p className="font-medium leading-tight">
                        {row.nombre_asesor}
                      </p>
                      <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                        DNI: {row.dni_asesor || "Pendiente"}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        <span className="inline-block px-1.5 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded text-[9px] font-bold uppercase tracking-wider">
                          {row.modalidad_aplicada}
                        </span>
                        <span
                          className="inline-block px-1.5 py-0.5 bg-muted text-muted-foreground rounded text-[9px] font-bold uppercase tracking-wider truncate max-w-[120px]"
                          title={row.sede_aplicada}
                        >
                          {row.sede_aplicada}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center align-top pt-4">
                      <span
                        className="font-medium text-foreground"
                        title="Instaladas"
                      >
                        {row.ventas_instaladas_mes_actual}
                      </span>
                      <span className="text-muted-foreground mx-1">/</span>
                      <span
                        className="font-medium text-blue-600 dark:text-blue-400"
                        title="Pagadas"
                      >
                        {row.ventas_pagadas_mes_anterior}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground align-top pt-4">
                      S/ {Number(row.sueldo_base_aplicado).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right align-top pt-3">
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-medium text-green-600 dark:text-green-500">
                          + S/ {Number(row.comision_neta_ganada).toFixed(2)}
                        </span>
                        <div className="flex gap-1.5 text-[10px]">
                          <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 rounded">
                            {Number(row.porcentaje_pozo_aplicado) * 100}%
                          </span>
                          <span
                            className={cn(
                              "px-1.5 rounded",
                              Number(row.multiplicador_alto_valor) >= 1.1
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : Number(row.multiplicador_alto_valor) === 1.0
                                  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                            )}
                          >
                            x{Number(row.multiplicador_alto_valor).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right align-top pt-4">
                      {Number(row.descuento_inasistencias) > 0 ? (
                        <span className="text-red-600 dark:text-red-400 font-medium">
                          - S/ {Number(row.descuento_inasistencias).toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">S/ 0.00</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right bg-primary/5 align-top pt-4">
                      <span className="font-bold text-base text-primary">
                        S/ {Number(row.sueldo_neto_final).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-muted-foreground align-top pt-4">
                      <div className="flex items-center justify-center gap-1">
                        <CheckCircle2
                          size={12}
                          className="text-green-500 shrink-0"
                        />
                        <span className="truncate max-w-[80px]">
                          {row.nombre_rrhh}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
