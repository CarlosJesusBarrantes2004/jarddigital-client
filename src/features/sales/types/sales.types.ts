// ==========================================
// CATÁLOGOS
// ==========================================

export interface RolSistema {
  codigo: "ASESOR" | "BACKOFFICE" | "SUPERVISOR" | "DUENO";
  nombre: string;
}

export interface EstadoSOT {
  id: number;
  codigo: string;
  nombre: string;
  orden: number | null;
  es_final: boolean;
  color_hex: string;
  activo: boolean;
}

export interface SubEstadoSOT {
  id: number;
  nombre: string;
  color_hex: string;
  requiere_nueva_fecha: boolean;
  activo: boolean;
}

export interface EstadoAudio {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
}

export interface Producto {
  id: number;
  nombre_plan: string;
  es_alto_valor: boolean;
  costo_fijo_plan: string;
  comision_base: string;
  fecha_inicio_vigencia: string;
  fecha_fin_vigencia: string | null;
  activo: boolean;
}

export interface GrabadorAudio {
  id: number;
  id_usuario: number | null;
  nombre_completo: string;
  activo: boolean;
}

export interface TipoDocumento {
  id: number;
  codigo: string; // "DNI" | "RUC" | "CE" | etc.
  nombre: string;
}

export interface ModalidadSede {
  id: number;
  // Expandir según tu modelo core
}

// ==========================================
// UBIGEO - Cascada
// ==========================================

export interface Departamento {
  id: number;
  nombre: string;
  codigo: string;
}

export interface Provincia {
  id: number;
  nombre: string;
  codigo: string;
  id_departamento: number;
}

export interface Distrito {
  id: number;
  nombre: string;
  codigo: string;
  id_provincia: number;
}

// ==========================================
// AUDIO DE VENTA
// ==========================================

export interface AudioVenta {
  id?: number;
  nombre_etiqueta: string;
  url_audio: string;
  conforme: boolean | null;
  motivo: string | null;
  corregido: boolean;
}

export interface AudioVentaForm {
  nombre_etiqueta: string;
  url_audio: string;
}

// ==========================================
// VENTA PRINCIPAL
// ==========================================

export interface Venta {
  id: number;

  // Vinculación (read-only)
  id_asesor: number;
  nombre_asesor: string;
  id_origen_venta: number;
  id_supervisor_vigente: number;
  nombre_supervisor: string;

  // Producto & cliente
  id_producto: number;
  nombre_producto: string;
  tecnologia: string;
  id_tipo_documento: number;
  cliente_numero_doc: string;
  cliente_nombre: string;
  cliente_telefono: string;
  cliente_email: string;
  id_distrito_nacimiento: number | null;
  cliente_papa: string;
  cliente_mama: string;
  numero_instalacion: string;
  cliente_fecha_nacimiento: string;

  // Representante legal (solo RUC)
  representante_legal_dni: string | null;
  representante_legal_nombre: string | null;

  // Ubicación
  id_distrito_instalacion: number;
  referencias: string | null;
  plano: string;
  direccion_detalle: string;
  coordenadas_gps: string;
  es_full_claro: boolean;
  score_crediticio: string;

  // Control
  solicitud_correccion: boolean;

  // Operativo
  codigo_sec: string | null;
  codigo_sot: string | null;
  fecha_venta: string | null;

  // Agenda
  fecha_visita_programada: string | null;
  bloque_horario: string | null;
  id_sub_estado_sot: number | null;

  // Estados finales
  fecha_real_inst: string | null;
  fecha_rechazo: string | null;
  id_estado_sot: number | null;
  nombre_estado: string | null;
  codigo_estado: string | null;
  comentario_gestion: string | null;

  // Segmentación automática
  tipo_venta: string | null;

  // Audios
  id_grabador_audios: number;
  audio_subido: boolean;
  fecha_subida_audios: string | null;
  id_estado_audios: number | null;
  fecha_revision_audios: string | null;
  usuario_revision_audios: number | null;
  observacion_audios: string | null;
  audios: AudioVenta[];

  // Auditoría
  usuario_creacion: number;
  fecha_creacion: string;
  usuario_modificacion: number | null;
  fecha_modificacion: string;
  activo: boolean;

  // Rastreo de reingreso
  venta_origen: number | null; // ID de la venta RECHAZADA que originó este reingreso
  codigo_sec_origen: string | null; // SEC de la venta origen (para pre-cargar en backoffice)
  codigo_sot_origen: string | null; // SOT de la venta origen
}

// ==========================================
// PAYLOADS
// ==========================================

export interface CreateVentaPayload {
  id_producto: number;
  tecnologia: string;
  id_tipo_documento: number;
  cliente_numero_doc: string;
  cliente_nombre: string;
  cliente_telefono: string;
  cliente_email: string;
  id_distrito_nacimiento: number | null;
  cliente_papa: string;
  cliente_mama: string;
  numero_instalacion: string;
  cliente_fecha_nacimiento: string;
  representante_legal_dni?: string | null;
  representante_legal_nombre?: string | null;
  id_distrito_instalacion: number;
  referencias?: string;
  plano: string;
  direccion_detalle: string;
  coordenadas_gps: string;
  es_full_claro: boolean;
  score_crediticio: string;
  id_grabador_audios: number;
  audios: AudioVentaForm[];
  // Si es reingreso, referencia a la venta rechazada original
  venta_origen?: number | null;
}

export interface UpdateVentaPayload {
  codigo_sec?: string;
  codigo_sot?: string;
  fecha_visita_programada?: string;
  bloque_horario?: string;
  id_sub_estado_sot?: number | null;
  id_estado_sot?: number | null;
  fecha_real_inst?: string | null;
  fecha_rechazo?: string | null;
  comentario_gestion?: string | null;
  id_estado_audios?: number | null;
  observacion_audios?: string | null;
  audio_subido?: boolean;
  audios?: Partial<AudioVenta>[];
  // Campos editables en corrección
  id_producto?: number;
  tecnologia?: string;
  id_tipo_documento?: number;
  cliente_numero_doc?: string;
  cliente_nombre?: string;
  cliente_telefono?: string;
  cliente_email?: string;
  id_distrito_nacimiento?: number | null;
  cliente_papa?: string;
  cliente_mama?: string;
  numero_instalacion?: string;
  cliente_fecha_nacimiento?: string;
  representante_legal_dni?: string | null;
  representante_legal_nombre?: string | null;
  id_distrito_instalacion?: number;
  referencias?: string;
  plano?: string;
  direccion_detalle?: string;
  coordenadas_gps?: string;
  es_full_claro?: boolean;
  score_crediticio?: string;
}

// ==========================================
// FILTROS & PAGINACIÓN
// ==========================================

export interface VentaFiltros {
  id_estado_sot?: number | string;
  id_sub_estado_sot?: number | string;
  id_estado_audios?: number | string;
  id_producto?: number | string;
  tecnologia?: string;
  es_full_claro?: boolean;
  search?: string;
  ordering?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ==========================================
// ESTADÍSTICAS ASESOR
// ==========================================

export interface EstadisticasAsesor {
  total: number;
  atendidas: number;
  en_ejecucion: number;
  rechazadas: number;
  pendientes: number; // estado_sot null
}

// ==========================================
// UBIGEO CASCADA (para form)
// ==========================================

export interface UbigeoCascadaValue {
  departamento_id: number | null;
  provincia_id: number | null;
  distrito_id: number | null;
}
