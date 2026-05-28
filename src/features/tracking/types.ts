// ============================================================
// TRACKING MODULE - TYPE DEFINITIONS
// Mirrors the Django backend models exactly
// ============================================================

export type ConformidadType = "CONFORME" | "INCONFORME";
export type EstadoSeguimientoType = "PENALIZADO" | "SUSPENDIDO" | "DESACTIVADO";
export type GeneroCliente = "M" | "F";

export interface SeguimientoMensual {
  id: number;
  mes_numero: number; // 1–6
  pago_cliente_realizado: boolean;
  fecha_seguimiento: string | null; // ISO date
  fecha_validacion_pago: string | null; // ISO date
  observacion: string | null;
  conformidad: ConformidadType | null;
  activo: boolean;
}

export interface VentaParaSeguimiento {
  id: number;
  codigo_sot: string;
  cliente_nombre: string;
  cliente_apellido?: string;
  cliente_dni?: string;
  cliente_numero_doc?: string;
  cliente_telefono?: string;
  cliente_direccion?: string;
  direccion_detalle?: string;
  cliente_fecha_nacimiento?: string;
  cliente_lugar_nacimiento?: string;
  departamento_nacimiento_nombre?: string;
  provincia_nacimiento_nombre?: string;
  distrito_nacimiento_nombre?: string;
  cliente_padre?: string;
  cliente_papa?: string;
  cliente_madre?: string;
  cliente_mama?: string;
  cliente_correo?: string;
  cliente_email?: string;
  cliente_genero?: GeneroCliente;
  fecha_real_inst?: string;
  id_producto?: {
    id: number;
    nombre: string;
    es_alto_valor: boolean;
  };
  id_asesor?: {
    id: number;
    nombre_completo: string;
  };
  estado_venta?: string;
}

export interface Seguimiento {
  id: number;
  venta: VentaParaSeguimiento;
  codigo_pago: string | null;
  ciclo_facturacion: string | null; // ISO date
  fecha_inicio: string | null;
  estado: EstadoSeguimientoType | null;
  descuento_realizado: boolean;
  meses_evaluados: SeguimientoMensual[];
  activo: boolean;
}

// ─── Filter params ───────────────────────────────────────────
export interface SeguimientoFilters {
  es_alto_valor?: boolean;
  estado?: EstadoSeguimientoType;
  descuento_realizado?: boolean;

  mes_instalacion?: number[];

  anio_instalacion?: number;
  primer_mes_pagado?: boolean;
  genero?: GeneroCliente;
  search?: string;
  ordering?: string;
  fecha_pago_desde?: string;
  fecha_pago_hasta?: string;
  fecha_seguimiento_desde?: string;
  fecha_seguimiento_hasta?: string;

  modalidad_sede?: number;
  page?: number;
  page_size?: number;
}

// ─── Update payloads ─────────────────────────────────────────
export interface UpdateSeguimientoPayload {
  codigo_pago?: string | null;
  ciclo_facturacion?: string | null;
  estado?: EstadoSeguimientoType | null;
  descuento_realizado?: boolean;
}

export interface UpdateSeguimientoMensualPayload {
  pago_cliente_realizado?: boolean;
  fecha_seguimiento?: string | null;
  fecha_validacion_pago?: string | null;
  observacion?: string | null;
  conformidad?: ConformidadType | null;
}

// ─── API response wrapper ────────────────────────────────────
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
