// ==========================================
// TIPOS — Módulo Productos
// ==========================================

export interface Producto {
  id: number;
  nombre_campana: string;
  tipo_solucion: string;
  nombre_paquete: string;
  es_alto_valor: boolean;
  costo_fijo_plan: string; // Django DecimalField → string en DRF
  comision_base: string;
  fecha_inicio_vigencia: string;
  fecha_fin_vigencia: string | null;
  activo: boolean;
}

export interface CreateProductoPayload {
  nombre_campana: string;
  tipo_solucion: string;
  nombre_paquete: string;
  es_alto_valor: boolean;
  costo_fijo_plan: string;
  comision_base: string;
  fecha_fin_vigencia: string | null;
  activo: boolean;
}

export type UpdateProductoPayload = Partial<CreateProductoPayload>;

export interface PaginatedProductos {
  count: number;
  next: string | null;
  previous: string | null;
  results: Producto[];
}

export interface ProductoFiltros {
  search?: string;
  nombre_campana?: string;
  tipo_solucion?: string;
  es_alto_valor?: boolean;
  activo?: boolean;
  page?: number;
}

// En productos.types.ts — agrega este tipo
export type ProductosResponse = Producto[] | PaginatedProductos;

// Opciones de tipo solución (del backend)
export const TIPOS_SOLUCION = ["1 PLAY", "2 PLAY", "3 PLAY"] as const;
export type TipoSolucion = (typeof TIPOS_SOLUCION)[number];
