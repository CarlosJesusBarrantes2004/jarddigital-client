export type StateCode = "EJECUCION" | "RECHAZADO" | "ATENDIDO";

export interface Sale {
  id: number;
  id_producto: number;
  tecnologia: string;
  id_tipo_documento: number;
  cliente_numero_doc: string;
  cliente_nombre: string;
  cliente_telefono: string;
  cliente_email: string;

  cliente_papa: string;
  cliente_mama: string;
  numero_instalacion: string;
  cliente_fecha_nacimiento: string;
  plano: string;

  representante_legal_dni?: string;
  representante_legal_nombre?: string;

  id_distrito_instalacion: number;
  id_distrito_nacimiento?: number;
  direccion_detalle: string;
  referencias?: string;
  coordenadas_gps?: string;
  es_full_claro: boolean;
  score_crediticio?: string;

  // Backoffice
  codigo_sec?: string;
  codigo_sot?: string;
  fecha_venta?: string;
  fecha_visita_programada?: string;
  bloque_horario?: string;
  id_sub_estado_sot?: number;
  id_estado_sot?: number;

  id_grabador_audios: number;
  audio_subido: boolean;
  id_estado_audios?: number;
  observacion_audios?: string;
  activo: boolean;

  nombre_asesor?: string;
  nombre_producto?: string;
  nombre_estado?: string;
  codigo_estado?: StateCode;
  nombre_supervisor?: string;
}

export type SalePayload = Omit<
  Sale,
  | "id"
  | "codigo_sec"
  | "codigo_sot"
  | "fecha_visita_programada"
  | "bloque_horario"
  | "id_sub_estado_sot"
  | "id_estado_sot"
  | "audio_subido"
  | "id_estado_audios"
  | "observacion_audios"
  | "activo"
  | "nombre_asesor"
  | "nombre_producto"
  | "nombre_estado"
  | "nombre_supervisor"
  | "fecha_venta"
>;

export interface BackofficePayload {
  codigo_sec?: string;
  codigo_sot?: string;
  fecha_visita_programada?: string;
  bloque_horario?: string;
  id_estado_sot?: number;
  id_sub_estado_sot?: number;
  id_estado_audios?: number;
  observacion_audios?: string;
  fecha_real_inst?: string;
  fecha_rechazo?: string;
}

export interface CatalogItem {
  id: number;
  codigo: string;
  nombre: string;
}
export interface ProductItem extends CatalogItem {
  nombre_plan: string;
  es_alto_valor: boolean;
}
