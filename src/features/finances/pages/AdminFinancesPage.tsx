import { useState, useEffect, useCallback } from "react";
import {
  Calculator,
  Calendar,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  Download,
  Eye,
  X,
  BadgeDollarSign,
  TrendingUp,
  AlertTriangle,
  Wallet,
  Package,
  Filter,
  Star,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getPlanillas,
  ejecutarLiquidacionMasiva,
  extraerErrorFinanzas,
  getExportarPlanillasExcelUrl,
  getProyeccionAsesorLive,
  type HistoricoPlanilla,
  type MiDashboardRespuesta,
} from "../services/finances.api";
import { toast } from "sonner";
import { api } from "@/api/axios";

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

  // Estados del Ojo de Dios
  const [showLiveModal, setShowLiveModal] = useState<boolean>(false);
  const [isLoadingLive, setIsLoadingLive] = useState<boolean>(false);
  const [liveData, setLiveData] = useState<MiDashboardRespuesta | null>(null);
  const [liveAlerta, setLiveAlerta] = useState<string | null>(null);
  const [selectedAsesorName, setSelectedAsesorName] = useState<string>("");

  // Tabla interna
  const [liveDetalleVentas, setLiveDetalleVentas] = useState<any[]>([]);
  const [liveFiltroAltoValor, setLiveFiltroAltoValor] = useState<
    "TODOS" | "SI" | "NO"
  >("TODOS");

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

  const handleVerProyeccionEnVivo = async (
    idUsuario: number,
    nombreAsesor: string,
  ) => {
    if (!idUsuario) {
      toast.error("ID de usuario no detectado.");
      return;
    }

    // Reseteamos estados previos por si acaso
    setLiveData(null);
    setLiveDetalleVentas([]);
    setSelectedAsesorName(nombreAsesor);
    setIsLoadingLive(true);
    setShowLiveModal(true);

    try {
      const mesAnterior = mes === 1 ? 12 : mes - 1;
      const anioAnterior = mes === 1 ? anio - 1 : anio;

      const [respuesta, { data: ventasResponse }] = await Promise.all([
        getProyeccionAsesorLive(idUsuario, mes, anio),
        api.get(`/sales/ventas/`, {
          // Mandamos diferentes variantes por si el backend recibe otro nombre de query param
          params: {
            mes_instalacion: mesAnterior,
            anio_instalacion: anioAnterior,
            id_asesor: idUsuario,
            asesor: idUsuario,
          },
        }),
      ]);

      setLiveData(respuesta.data);
      setLiveAlerta(respuesta.alerta);

      const rawVentas = ventasResponse.results || ventasResponse || [];

      // ESCUDO PROTECTOR FRONTEND: Filtramos manualmente las ventas por el asesor clickeado.
      // Esto evita que si el dueño tiene permiso global, vea las ventas de todos.
      const ventasAisladas = rawVentas.filter((v: any) => {
        if (!v.id_asesor && !v.asesor) return true; // Confía en el backend si no provee el objeto

        // Verifica si id_asesor es un número o un objeto relacional
        const checkId =
          v.id_asesor?.id || v.id_asesor || v.asesor?.id || v.asesor;
        return Number(checkId) === Number(idUsuario);
      });

      setLiveDetalleVentas(ventasAisladas);
    } catch (error) {
      toast.error("No se pudo calcular la proyección de este asesor");
      setShowLiveModal(false);
    } finally {
      setIsLoadingLive(false);
    }
  };

  const handleEjecutarLiquidacion = () => {
    const mesNombre = MESES.find((m) => m.valor === mes)?.nombre;
    toast.warning(`¿Liquidar mes de ${mesNombre} ${anio}?`, {
      description:
        "Esto calculará y guardará irreversiblemente el sueldo de todos los asesores activos.",
      duration: 10000,
      action: {
        label: "Sí, ejecutar",
        onClick: async () => {
          setIsLiquidating(true);
          const toastId = toast.loading("Calculando liquidaciones...");
          try {
            const respuesta = await ejecutarLiquidacionMasiva(mes, anio);
            toast.success("¡Liquidación Exitosa!", {
              id: toastId,
              description: respuesta.mensaje,
            });
            fetchPlanillas();
          } catch (error) {
            toast.error("No se pudo liquidar", {
              id: toastId,
              description: extraerErrorFinanzas(error),
            });
          } finally {
            setIsLiquidating(false);
          }
        },
      },
      cancel: { label: "Cancelar", onClick: () => toast.dismiss() },
    });
  };

  const ventasFiltradasLive = liveDetalleVentas.filter((venta: any) => {
    if (liveFiltroAltoValor === "SI")
      return venta.producto_es_alto_valor === true;
    if (liveFiltroAltoValor === "NO")
      return venta.producto_es_alto_valor === false;
    return true;
  });

  const mesAnteriorObj = MESES.find(
    (m) => m.valor === (mes === 1 ? 12 : mes - 1),
  );

  console.log(planillas);

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Calculator className="text-primary" /> Gestión de Planillas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visualiza el histórico de pagos, audita proyecciones en vivo o
            ejecuta el cálculo masivo.
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
                  <th className="px-4 py-3 text-center">Auditar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {planillas.map((row) => (
                  <tr
                    key={`planilla-${row.id}-${row.id_usuario}`}
                    className="hover:bg-muted/30 transition-colors group"
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
                        <span className="inline-block px-1.5 py-0.5 bg-muted text-muted-foreground rounded text-[9px] font-bold uppercase tracking-wider truncate max-w-[120px]">
                          {row.sede_aplicada}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center align-top pt-4">
                      <span className="font-medium text-foreground">
                        {row.ventas_instaladas_mes_actual}
                      </span>
                      <span className="text-muted-foreground mx-1">/</span>
                      <span className="font-medium text-blue-600 dark:text-blue-400">
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
                                ? "bg-green-100 text-green-700"
                                : Number(row.multiplicador_alto_valor) === 1.0
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-red-100 text-red-700",
                            )}
                          >
                            x{Number(row.multiplicador_alto_valor).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right align-top pt-4">
                      {Number(row.descuento_inasistencias) > 0 ? (
                        <span className="text-red-600 font-medium">
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
                    <td className="px-4 py-3 text-center align-top pt-3">
                      <button
                        onClick={() =>
                          handleVerProyeccionEnVivo(
                            row.id_usuario,
                            row.nombre_asesor,
                          )
                        }
                        title="Ver Proyección del Asesor"
                        className="p-1.5 mx-auto text-muted-foreground hover:text-primary bg-background border border-border rounded-lg shadow-sm transition-all hover:scale-105 flex items-center justify-center"
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL CLON EXACTO DE LA VISTA DEL ASESOR */}
      {/* ========================================================================= */}
      {showLiveModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-7xl rounded-2xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            {/* ENCABEZADO DEL MODAL */}
            <div className="px-6 py-4 border-b border-border bg-muted/20 flex justify-between items-center shrink-0">
              <div>
                <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-primary">
                  Vista de Asesor
                </span>
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mt-0.5">
                  <Wallet className="text-primary w-5 h-5" /> Liquidación de{" "}
                  {selectedAsesorName}
                </h2>
              </div>
              <button
                onClick={() => setShowLiveModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 bg-background">
              {isLoadingLive ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <RefreshCw
                    size={32}
                    className="animate-spin text-primary mb-4"
                  />
                  <p className="text-sm font-medium">
                    Extrayendo datos de la base de datos...
                  </p>
                </div>
              ) : liveData ? (
                <>
                  {liveAlerta && (
                    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs leading-relaxed animate-in fade-in duration-300">
                      <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                      <p>{liveAlerta}</p>
                    </div>
                  )}

                  {/* IDENTIFICADOR VISUAL */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted text-muted-foreground rounded text-[10px] font-bold uppercase tracking-wider border border-border">
                      <MapPin size={10} /> {liveData.sede_aplicada}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded text-[10px] font-bold uppercase tracking-wider border border-purple-200 dark:border-purple-800">
                      {liveData.modalidad_aplicada}
                    </span>
                  </div>

                  {/* 1. LAS MISMAS 4 TARJETAS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between shadow-sm">
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-medium text-muted-foreground">
                          Sueldo Base
                        </span>
                        <div className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg">
                          <BadgeDollarSign size={18} />
                        </div>
                      </div>
                      <div className="mt-4">
                        <span className="text-2xl font-bold text-foreground">
                          S/ {Number(liveData.sueldo_base_aplicado).toFixed(2)}
                        </span>
                        {liveData.escenario_sueldo === "ELITE" && (
                          <p className="text-[11px] font-medium text-yellow-600 mt-1 uppercase tracking-wider">
                            ★ Sueldo Élite
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between shadow-sm">
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-medium text-muted-foreground">
                          Faltas / Desc.
                        </span>
                        <div className="p-2 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-lg">
                          <AlertTriangle size={18} />
                        </div>
                      </div>
                      <div className="mt-4">
                        <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                          - S/ {Number(liveData.descuento_faltas).toFixed(2)}
                        </span>
                        <p className="text-xs text-muted-foreground mt-1">
                          {liveData.dias_falta} falta(s) en{" "}
                          {MESES.find((m) => m.valor === mes)?.nombre}
                        </p>
                      </div>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between shadow-sm">
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-medium text-muted-foreground">
                          Comisiones
                        </span>
                        <div className="p-2 bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded-lg">
                          <TrendingUp size={18} />
                        </div>
                      </div>
                      <div className="mt-4">
                        <span className="text-2xl font-bold text-green-600 dark:text-green-500">
                          + S/ {Number(liveData.comision_neta).toFixed(2)}
                        </span>
                        <div className="flex items-center gap-2 mt-1 text-xs">
                          <span className="text-muted-foreground">
                            Mult. AV:
                          </span>
                          <span
                            className={cn(
                              "font-bold",
                              Number(liveData.multiplicador_av) >= 1.1
                                ? "text-green-600"
                                : Number(liveData.multiplicador_av) === 1.0
                                  ? "text-yellow-600"
                                  : "text-red-500",
                            )}
                          >
                            x{Number(liveData.multiplicador_av).toFixed(2)}
                          </span>
                        </div>
                        {liveData.escenario_comisiones === "ELITE" && (
                          <p className="text-[11px] font-medium text-yellow-600 mt-1 uppercase tracking-wider">
                            ★ Regla Élite Aplicada
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="bg-primary text-primary-foreground rounded-xl p-5 flex flex-col justify-between shadow-md relative overflow-hidden border-transparent">
                      <div className="absolute -right-6 -top-6 text-primary-foreground/10">
                        <Wallet size={120} />
                      </div>
                      <span className="text-sm font-medium text-primary-foreground/80 uppercase tracking-wider relative z-10">
                        Neto a Depositar
                      </span>
                      <div className="mt-4 relative z-10">
                        <span className="text-3xl font-black">
                          S/ {Number(liveData.sueldo_neto_final).toFixed(2)}
                        </span>
                        <p className="text-[10px] text-primary-foreground/70 mt-1 uppercase tracking-widest font-mono">
                          Sujeto a confirmación final.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 2. LA MISMA TABLA DE DETALLE DE VENTAS */}
                  <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col mt-4">
                    <div className="p-4 border-b border-border bg-muted/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        <Package size={16} className="text-primary" /> Ventas de{" "}
                        {mesAnteriorObj?.nombre} (Base para comisión)
                      </h3>
                      <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                          <span className="font-medium text-foreground">
                            {liveData.ventas_pagadas}
                          </span>{" "}
                          pagadas de{" "}
                          <span className="font-medium text-foreground">
                            {liveDetalleVentas.length}
                          </span>{" "}
                          instaladas
                        </div>
                        <div className="flex items-center gap-2 bg-background border border-border rounded-md px-2 h-8 w-full sm:w-auto">
                          <Filter size={14} className="text-muted-foreground" />
                          <select
                            value={liveFiltroAltoValor}
                            onChange={(e) =>
                              setLiveFiltroAltoValor(e.target.value as any)
                            }
                            className="text-xs bg-transparent border-none outline-none focus:ring-0 text-foreground w-full cursor-pointer"
                          >
                            <option value="TODOS">Todas las ventas</option>
                            <option value="SI">Solo Alto Valor</option>
                            <option value="NO">Ventas Normales</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 text-muted-foreground uppercase text-[11px] font-semibold tracking-wider">
                          <tr>
                            <th className="px-4 py-3">Cliente</th>
                            <th className="px-4 py-3">Producto / Plan</th>
                            <th className="px-4 py-3 text-center">
                              Alto Valor
                            </th>
                            <th className="px-4 py-3 text-center">
                              Estado (Mes 1)
                            </th>
                            <th className="px-4 py-3 text-right">Costo Fijo</th>
                            <th className="px-4 py-3 text-right">
                              Comisión Base
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {ventasFiltradasLive.length === 0 ? (
                            <tr>
                              <td
                                colSpan={6}
                                className="px-4 py-8 text-center text-muted-foreground"
                              >
                                No se encontraron ventas para este filtro o
                                periodo.
                              </td>
                            </tr>
                          ) : (
                            ventasFiltradasLive.map((venta: any) => (
                              <tr key={venta.id} className="hover:bg-muted/30">
                                <td className="px-4 py-3">
                                  <p className="font-medium text-foreground">
                                    {venta.cliente_nombre}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Doc: {venta.cliente_numero_doc}
                                  </p>
                                </td>
                                <td className="px-4 py-3">
                                  <p className="font-medium text-foreground">
                                    {venta.producto_paquete || "Plan Base"}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {venta.producto_campana || "Campaña"}
                                  </p>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {venta.producto_es_alto_valor ? (
                                    <span className="inline-flex items-center gap-1 text-yellow-600 dark:text-yellow-500 font-medium text-xs">
                                      <Star
                                        size={14}
                                        className="fill-current"
                                      />{" "}
                                      Sí
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground text-xs">
                                      —
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {venta.pago_primer_mes ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>{" "}
                                      Pagado
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-500">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>{" "}
                                      Pendiente
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-right text-muted-foreground">
                                  S/{" "}
                                  {Number(
                                    venta.producto_costo_fijo || 0,
                                  ).toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-right font-medium text-foreground">
                                  S/{" "}
                                  {liveData.modalidad_aplicada === "CAMPO"
                                    ? Number(
                                        venta.producto_comision_base_campo || 0,
                                      ).toFixed(2)
                                    : Number(
                                        venta.producto_comision_base_call || 0,
                                      ).toFixed(2)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
