export type EstadoSOT = "ATENDIDO" | "PENDIENTE" | "RECHAZADO" | "EN_EJECUCION";
export type Modalidad = "CALL" | "CAMPO";
export type DimensionJerarquica = "GEOGRAFIA" | "PRODUCTO";

export const ESTADO_SOT_OPTIONS: { value: EstadoSOT; label: string }[] = [
  { value: "ATENDIDO", label: "Atendido" },
  { value: "PENDIENTE", label: "Pendiente" },
  { value: "RECHAZADO", label: "Rechazado" },
  { value: "EN_EJECUCION", label: "En Ejecución" },
];

export const MODALIDAD_OPTIONS: { value: Modalidad; label: string }[] = [
  { value: "CALL", label: "Call" },
  { value: "CAMPO", label: "Campo" },
];

// ==========================================
// ENDPOINT 1 — Matriz Pivote (Gráficos 1 y 3)
// ==========================================
export interface FilaMatrizPivote {
  asesor_id: number;
  asesor_nombre: string;
  sede_modalidad: string;
  total_asesor: number;
  // m1..m12 llegan dinámicos desde el backend
  [key: `m${number}`]: number | string | undefined;
}

export interface TotalesColumnasMatriz {
  grand_total: number;
  [key: `m${number}`]: number;
}

export interface MatrizPivoteResponse {
  filas: FilaMatrizPivote[];
  totales_columnas: TotalesColumnasMatriz;
}

export interface MatrizPivoteParams {
  anio: number;
  estado_sot: EstadoSOT;
}

// ==========================================
// ENDPOINT 2 — Barras de Rendimiento (Gráficos 2 y 4)
// ==========================================
export interface FilaBarraRendimiento {
  asesor_id: number;
  asesor_nombre: string;
  sede_modalidad: string;
  total_ventas: number;
  total_pagadas: number;
  num_mes?: number; // solo presente en el modo "evolución" (Gráfico 4, sin mes fijo)
}

export interface BarrasRendimientoParams {
  anio: number;
  estado_sot?: EstadoSOT;
  mes?: number; // si se manda -> Gráfico 2 (snapshot de un mes)
  id_asesor?: number; // si se manda -> Gráfico 4 filtrado a 1 asesor
}

// ==========================================
// ENDPOINT 3 — Tendencia Diaria (Gráfico 5)
// ==========================================
export interface PuntoTendenciaDiaria {
  fecha: string; // YYYY-MM-DD
  total: number;
}

export interface TendenciaDiariaResponse {
  anio: number;
  mes: number;
  modalidad: Modalidad | "TODAS";
  serie: PuntoTendenciaDiaria[];
  total_mes: number;
}

export interface TendenciaDiariaParams {
  anio: number;
  mes: number;
  modalidad?: Modalidad;
  id_sede?: number;
}

// ==========================================
// ENDPOINT 4 — Árbol Jerárquico (Gráfico 6)
// ==========================================
export interface ItemNivelJerarquico {
  item_id: number | string;
  item_nombre: string;
  total: number;
}

export interface NivelJerarquicoResponse {
  dimension: DimensionJerarquica;
  nivel: string; // nombre del nivel ej: "departamento", "campana"
  indice_nivel: number;
  tiene_siguiente_nivel: boolean;
  items: ItemNivelJerarquico[];
}

export interface NivelJerarquicoParams {
  estado_sot: EstadoSOT;
  dimension: DimensionJerarquica;
  nivel: number;
  anio?: number;
  mes?: number;
  padre_id?: string;
  solo_alto_valor?: boolean;
  modalidad?: Modalidad;
  id_sede?: number;
}

// Para mantener el breadcrumb de navegación en el árbol
export interface MigaDePan {
  nivel: number;
  item_id: string;
  item_nombre: string;
}

// ==========================================
// DASHBOARD ASESOR (consumido desde features/sales)
// ==========================================
export interface DesgloseMensualAsesor {
  mes: number;
  total_atendidas: number;
  total_pagadas: number;
  total_pendientes: number;
}

export interface TopProductoAsesor {
  nombre: string;
  total: number;
}

export interface ProyeccionMotivacional {
  ventas_mes_actual_hasta_hoy: number;
  ventas_mes_anterior_hasta_hoy: number;
  tendencia: "MEJOR" | "PEOR" | "IGUAL";
  porcentaje: number;
  mensaje: string;
}

export interface TotalesAnioAsesor {
  gran_total_atendidas: number;
  gran_total_pagadas: number;
  gran_total_pendientes: number;
}

export interface MisMetricasAsesorResponse {
  anio_evaluado: number;
  asesor: string;
  totales_anio: TotalesAnioAsesor;
  desglose_mensual: DesgloseMensualAsesor[];
  top_productos: TopProductoAsesor[];
  proyeccion_motivacional: ProyeccionMotivacional | null;
}

export interface RetencionMes {
  mes_cobro: number;
  etiqueta: string;
  pagaron: number;
  porcentaje: number;
}

export interface RetencionPagosResponse {
  anio: number;
  mes_instalacion: number | null;
  total_instaladas: number;
  retencion: RetencionMes[];
}

export interface RetencionPagosParams {
  anio: number;
  mes?: number;
  modalidad?: Modalidad;
  id_sede?: number;
}
