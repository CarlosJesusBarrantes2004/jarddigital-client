import { api } from "@/api/axios";

// ==========================================
// 1. INTERFACES Y TIPOS
// ==========================================
export interface ReglaComision {
  id: number;
  periodo_inicio: string;
  escenario: "ESTANDAR" | "ELITE";
  id_modalidad: number;
  codigo_modalidad: string;
  min_ventas_pagadas_medio: number;
  min_ventas_pagadas_optimo: number;
  alto_valor_nivel_1: number;
  alto_valor_nivel_2: number;
  alto_valor_nivel_3: number;
  sueldo_base_elite: string | number;
  activo: boolean;
  creado_en: string;
}

export interface ReglaComisionPayload extends Omit<
  ReglaComision,
  "id" | "creado_en" | "codigo_modalidad"
> {}

export interface HistoricoPlanilla {
  id: number;
  id_usuario: number;
  nombre_asesor: string;
  dni_asesor: string | null;
  sede_aplicada: string;
  mes_fiscal: number;
  anio_fiscal: number;
  modalidad_aplicada: string;
  ventas_instaladas_mes_actual: number;
  ventas_pagadas_mes_anterior: number;
  ventas_alto_valor_pagadas: number;
  cantidad_faltas: number;
  sueldo_base_aplicado: string;
  porcentaje_pozo_aplicado: string;
  multiplicador_alto_valor: string;
  pozo_comisiones_bruto: string;
  comision_neta_ganada: string;
  descuento_inasistencias: string;
  sueldo_neto_final: string;
  fecha_liquidacion: string;
  procesado_por: number;
  nombre_rrhh: string;
}

export interface MiDashboardRespuesta {
  id_usuario: number;
  nombre_completo: string;
  modalidad_aplicada: string;
  sede_aplicada: string;
  escenario_sueldo: "ESTANDAR" | "ELITE";
  escenario_comisiones: "ESTANDAR" | "ELITE";
  ventas_instaladas: number;
  ventas_pagadas: number;
  ventas_alto_valor: number;
  sueldo_base_aplicado: number | string;
  pozo_bruto: number | string;
  porcentaje_pozo: number | string;
  multiplicador_av: number | string;
  comision_neta: number | string;
  dias_falta: number;
  descuento_faltas: number | string;
  sueldo_neto_final: number | string;
}

export interface LiquidacionRespuesta {
  mensaje: string;
  total_procesados: number;
  creados: number;
  actualizados: number;
}

// ---> INTERFAZ PARA EL DUEÑO/COORDINADOR <---
export interface ProyeccionAsesorLiveResponse {
  tipo_dato: string;
  alerta: string | null;
  data: MiDashboardRespuesta;
}

// ==========================================
// 2. ENDPOINTS DE LA API
// ==========================================

export const getReglasComision = async (page = 1) => {
  const { data } = await api.get<{ results: ReglaComision[]; count: number }>(
    `/finances/reglas-comision/?page=${page}`,
  );
  return data;
};

export const createReglaComision = async (payload: ReglaComisionPayload) => {
  const { data } = await api.post<ReglaComision>(
    `/finances/reglas-comision/`,
    payload,
  );
  return data;
};

export const updateReglaComision = async (
  id: number,
  payload: Partial<ReglaComisionPayload>,
) => {
  const { data } = await api.patch<ReglaComision>(
    `/finances/reglas-comision/${id}/`,
    payload,
  );
  return data;
};

export const deleteReglaComision = async (id: number) => {
  const { data } = await api.delete(`/finances/reglas-comision/${id}/`);
  return data;
};

export const getPlanillas = async (params?: {
  mes_fiscal?: number;
  anio_fiscal?: number;
  id_usuario?: number;
}) => {
  const { data } = await api.get<HistoricoPlanilla[]>(`/finances/planillas/`, {
    params,
  });
  return data;
};

export const ejecutarLiquidacionMasiva = async (mes: number, anio: number) => {
  const { data } = await api.post<LiquidacionRespuesta>(
    `/finances/planillas/ejecutar_liquidacion/`,
    { mes, anio },
  );
  return data;
};

export const getMiDashboardFinanciero = async (mes?: number, anio?: number) => {
  const params: Record<string, number> = {};
  if (mes) params.mes = mes;
  if (anio) params.anio = anio;
  const { data } = await api.get<MiDashboardRespuesta>(
    `/finances/mi-dashboard/`,
    { params },
  );
  return data;
};

// ---> NUEVO ENDPOINT: OJO DE DIOS (PROYECCIÓN EN VIVO) <---
export const getProyeccionAsesorLive = async (
  idUsuario: number,
  mes: number,
  anio: number,
) => {
  const { data } = await api.get<ProyeccionAsesorLiveResponse>(
    `/finances/planillas/proyeccion-asesor/`,
    {
      params: { id_usuario: idUsuario, mes, anio },
    },
  );
  return data;
};

export const extraerErrorFinanzas = (error: any): string => {
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;
    if (status === 409)
      return (
        data.error || "Ya existe un proceso ejecutándose. Espere unos segundos."
      );
    if (status === 400 || status === 403)
      return data.error || "Datos inválidos o acción no permitida.";
    if (status >= 500)
      return "Error crítico en el servidor al procesar las finanzas.";
  }
  return "Error de conexión con el servidor.";
};

export const getExportarPlanillasExcelUrl = (mes: number, anio: number) => {
  const baseUrl = api.defaults.baseURL || "";
  return `${baseUrl}/finances/planillas/exportar-excel/?mes_fiscal=${mes}&anio_fiscal=${anio}`;
};

export const getModalidades = async () => {
  const { data } =
    await api.get<{ id: number; codigo: string; nombre: string }[]>(
      `/core/modalidades/`,
    );
  return data;
};

// ==========================================
// NO-ASESORES (SUPERVISORES/COORDINADORES)
// ==========================================
export interface NoAsesorPlanilla {
  id_usuario: number;
  nombre_completo: string;
  dni: string;
  rol: string;
  modalidad_aplicada: string;
  sede_aplicada: string;
  sueldo_base: string;
  comision_neta: string;
  dias_falta: number;
  descuento_faltas: string;
  sueldo_neto_final: string;
}

export const getPlanillasNoAsesores = async (mes: number, anio: number) => {
  const { data } = await api.get<NoAsesorPlanilla[]>(
    `/finances/planillas/no-asesores/`,
    { params: { mes, anio } },
  );
  return data;
};
