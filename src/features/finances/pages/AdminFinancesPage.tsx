import { useState, useEffect, useCallback } from "react";
import {
  Calculator,
  Calendar,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Importamos nuestros servicios
import {
  getPlanillas,
  ejecutarLiquidacionMasiva,
  extraerErrorFinanzas,
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

  // Estados para filtros
  const [mes, setMes] = useState<number>(hoy.getMonth() + 1);
  const [anio, setAnio] = useState<number>(hoy.getFullYear());

  // Estados de datos y carga
  const [planillas, setPlanillas] = useState<HistoricoPlanilla[]>([]);
  const [isLoadingTable, setIsLoadingTable] = useState<boolean>(true);
  const [isLiquidating, setIsLiquidating] = useState<boolean>(false);

  // Función para cargar la tabla
  const fetchPlanillas = useCallback(async () => {
    setIsLoadingTable(true);
    try {
      const data = await getPlanillas({ mes_fiscal: mes, anio_fiscal: anio });
      setPlanillas(data);
    } catch (error) {
      console.error("Error al cargar planillas:", error);
      toast.error("Error de lectura");
    } finally {
      setIsLoadingTable(false);
    }
  }, [mes, anio]);

  // Cargar al montar el componente o cambiar filtros
  useEffect(() => {
    fetchPlanillas();
  }, [fetchPlanillas]);

  // Handler para el Botón de Pánico
  const handleEjecutarLiquidacion = () => {
    const mesNombre = MESES.find((m) => m.valor === mes)?.nombre;

    // 1. Toast interactivo de Confirmación (Reemplaza a Swal.fire modal)
    toast.warning(`¿Liquidar mes de ${mesNombre} ${anio}?`, {
      description:
        "Esto calculará y guardará irreversiblemente el sueldo de todos los asesores activos. ¿Deseas continuar?",
      duration: 10000, // Le damos 10 segundos para que no se cierre rápido
      action: {
        label: "Sí, ejecutar",
        onClick: async () => {
          // 2. Ejecución de la API
          setIsLiquidating(true);

          // Creamos un toast de carga que no se cierra hasta que el backend responda
          const toastId = toast.loading(
            "Calculando liquidaciones de toda la empresa...",
          );

          try {
            const respuesta = await ejecutarLiquidacionMasiva(mes, anio);

            // 3. Éxito: Actualizamos el toast de carga a un toast de éxito
            toast.success("¡Liquidación Exitosa!", {
              id: toastId, // Usamos el ID para reemplazar el de carga
              description: respuesta.mensaje,
              duration: 4000,
            });

            // Refrescamos la tabla para ver los nuevos datos
            fetchPlanillas();
          } catch (error) {
            // 4. Error: Actualizamos el toast mostrando el 400, 403 o 409
            toast.error("No se pudo liquidar", {
              id: toastId, // Reemplaza el toast de carga
              description: extraerErrorFinanzas(error),
              duration: 6000,
            });
          } finally {
            setIsLiquidating(false);
          }
        },
      },
      cancel: {
        label: "Cancelar",
        onClick: () => toast.dismiss(), // Cierra el toast limpiamente
      },
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6 animate-in fade-in duration-300">
      {/* HEADER DE LA PÁGINA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Calculator className="text-primary" />
            Gestión de Planillas y Liquidaciones
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visualiza el histórico de pagos o ejecuta el cálculo mensual de los
            asesores.
          </p>
        </div>
      </div>

      {/* BARRA DE HERRAMIENTAS Y FILTROS */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-col md:flex-row gap-4 items-end justify-between shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          {/* Select de Mes */}
          <div className="flex flex-col gap-1.5 w-full md:w-40">
            <label className="text-[13px] font-medium text-muted-foreground flex items-center gap-1.5">
              <Calendar size={14} /> Mes Fiscal
            </label>
            <select
              value={mes}
              onChange={(e) => setMes(Number(e.target.value))}
              disabled={isLiquidating}
              className="h-10 bg-background border border-input rounded-md px-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50 outline-none"
            >
              {MESES.map((m) => (
                <option key={m.valor} value={m.valor}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Select de Año */}
          <div className="flex flex-col gap-1.5 w-full md:w-32">
            <label className="text-[13px] font-medium text-muted-foreground">
              Año Fiscal
            </label>
            <select
              value={anio}
              onChange={(e) => setAnio(Number(e.target.value))}
              disabled={isLiquidating}
              className="h-10 bg-background border border-input rounded-md px-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50 outline-none"
            >
              {[anio - 1, anio, anio + 1].map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* BOTÓN DE PÁNICO (RRHH) */}
        <button
          onClick={handleEjecutarLiquidacion}
          disabled={isLiquidating}
          className={cn(
            "h-10 px-6 rounded-md font-medium text-sm flex items-center gap-2 text-primary-foreground shadow-sm transition-all whitespace-nowrap",
            isLiquidating
              ? "bg-primary/70 cursor-not-allowed"
              : "bg-primary hover:bg-primary/90 hover:-translate-y-0.5",
          )}
        >
          {isLiquidating ? (
            <>
              <RefreshCw size={16} className="animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <FileSpreadsheet size={16} />
              Ejecutar Liquidación del Mes
            </>
          )}
        </button>
      </div>

      {/* CONTENEDOR DE LA TABLA */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        {isLoadingTable ? (
          // ESTADO DE CARGA
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <RefreshCw size={32} className="animate-spin text-primary mb-4" />
            <p className="text-sm font-medium">
              Cargando registros financieros...
            </p>
          </div>
        ) : planillas.length === 0 ? (
          // ESTADO VACÍO
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <AlertCircle size={40} className="text-muted-foreground/50 mb-3" />
            <p className="text-base font-medium text-foreground">
              No hay liquidaciones para este mes
            </p>
            <p className="text-sm mt-1 max-w-sm text-center">
              Haz clic en "Ejecutar Liquidación del Mes" para calcular las
              comisiones de los asesores correspondientes a este periodo.
            </p>
          </div>
        ) : (
          // TABLA DE DATOS
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-[11px] font-semibold tracking-wider">
                <tr>
                  <th className="px-4 py-3">Asesor</th>
                  <th className="px-4 py-3 text-center">
                    Ventas <br />
                    (Inst. mes actual / Pag. mes anterior)
                  </th>
                  <th className="px-4 py-3 text-right">Sueldo Base</th>
                  <th className="px-4 py-3 text-right">
                    Comisión <br />
                    (% / Multiplicador)
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
                    <td className="px-4 py-3 font-medium text-foreground">
                      {row.nombre_asesor}
                    </td>
                    <td className="px-4 py-3 text-center">
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
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      S/ {Number(row.sueldo_base_aplicado).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
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
                    <td className="px-4 py-3 text-right">
                      {Number(row.descuento_inasistencias) > 0 ? (
                        <span className="text-red-600 dark:text-red-400 font-medium">
                          - S/ {Number(row.descuento_inasistencias).toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">S/ 0.00</span>
                      )}
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        ({row.cantidad_faltas} días)
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right bg-primary/5">
                      <span className="font-bold text-base text-primary">
                        S/ {Number(row.sueldo_neto_final).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-muted-foreground">
                      <div className="flex items-center justify-center gap-1">
                        <CheckCircle2 size={12} className="text-green-500" />
                        {row.nombre_rrhh}
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
