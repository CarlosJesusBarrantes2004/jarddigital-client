export interface PromocionTerritorio {
  id?: number;
  id_departamento: number | null;
  nombre_departamento?: string | null;
  id_provincia: number | null;
  nombre_provincia?: string | null;
  id_distrito: number | null;
  nombre_distrito?: string | null;
}

export interface Promocion {
  id: number;
  titulo: string | null;
  descripcion: string | null;
  imagen_url: string | null;
  fecha_vencimiento: string | null;
  id_producto: number | null;
  producto_nombre_campana?: string | null;
  producto_nombre_paquete?: string | null;
  producto_costo_fijo?: string | null;
  producto_tipo_solucion?: string | null;
  id_autor: number | null;
  nombre_autor: string;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
  territorios: PromocionTerritorio[];
}

export interface CreatePromocionPayload {
  titulo?: string | null;
  descripcion?: string | null;
  imagen_url?: string | null;
  fecha_vencimiento?: string | null;
  id_producto?: number | null;
  territorios?: Omit<PromocionTerritorio, "id" | "nombre_departamento" | "nombre_provincia" | "nombre_distrito">[];
}

export type UpdatePromocionPayload = Partial<CreatePromocionPayload>;

export interface Departamento {
  id: number;
  nombre: string;
  codigo_ubigeo: string;
}

export interface Provincia {
  id: number;
  nombre: string;
  codigo_ubigeo: string;
  id_departamento: number;
}

export interface Distrito {
  id: number;
  nombre: string;
  codigo_ubigeo: string;
  id_provincia: number;
}
