// ==========================================
// CATÁLOGOS
// ==========================================

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
  nombre_campana: string;
  tipo_solucion: string;
  nombre_paquete: string;
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
  codigo: string; // "DNI" | "RUC" | "CE" etc.
  nombre: string;
}

// ==========================================
// UBIGEO
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
// AUDIO
// ==========================================

export interface AudioVenta {
  id?: number;
  nombre_etiqueta: string;
  url_audio: string;
  conforme: boolean | null;
  motivo: string | null;
  corregido: boolean;
  // Estado local para el form (no se envía al backend)
  _file?: File | null;
  _uploading?: boolean;
  _error?: string | null;
}

export interface AudioVentaForm {
  nombre_etiqueta: string;
  url_audio: string;
}

// Etiquetas de audios según tipo de documento
export const ETIQUETAS_AUDIO_DNI: string[] = [
  "1. Nombre completo del cliente",
  "2. Número de documento (DNI)",
  "3. Lugar y fecha de nacimiento",
  "4. Dirección de instalación",
  "5. Nombre del padre y madre",
  "6. Teléfono de contacto",
  "7. Correo electrónico",
  "8. NO (sin deudas)",
  "9. SI (acepta contrato)",
  "10. SI ACEPTO (términos)",
  "11. SI AUTORIZO (datos personales)",
  "12. SI ACEPTO (conformidad final)",
];

export const ETIQUETAS_AUDIO_RUC: string[] = [
  "1. Nombre completo del cliente",
  "2. Número de documento (RUC)",
  "3. Lugar y fecha de nacimiento",
  "4. Dirección de instalación",
  "5. Nombre del padre y madre",
  "6. Teléfono de contacto",
  "7. Correo electrónico",
  "8. NO (sin deudas)",
  "9. SI (acepta contrato)",
  "10. SI ACEPTO (términos)",
  "11. SI AUTORIZO (datos personales)",
  "12. SI ACEPTO (conformidad final)",
  "13. RUC del representante legal",
  "14. Nombre del representante legal",
];

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

  // Ubigeo de instalación (nombres resueltos)
  distrito_instalacion_nombre: string | null;
  provincia_instalacion_nombre: string | null;
  departamento_instalacion_nombre: string | null;

  // Producto & cliente
  id_producto: number;
  producto_campana: string;
  producto_solucion: string;
  producto_paquete: string;
  tecnologia: string;
  id_tipo_documento: number;
  cliente_numero_doc: string;
  cliente_nombre: string;
  cliente_telefono: string;
  cliente_email: string;
  id_distrito_nacimiento: number | null;
  cant_decos_adicionales: number;
  cant_repetidores_adicionales: number;
  cliente_papa: string;
  cliente_mama: string;
  numero_instalacion: string;
  cliente_fecha_nacimiento: string;
  cliente_genero: string;

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

  solicitud_correccion: boolean;
  permitir_reingreso: boolean;

  // Operativo
  codigo_sec: string | null;
  codigo_sot: string | null;
  fecha_venta: string | null;

  // Agenda
  fecha_visita_programada: string | null;
  bloque_horario: string | null;
  id_sub_estado_sot: number | null;
  /**
   * FIX #4: Nombre del sub-estado (campo calculado que el serializer puede incluir).
   * Si el backend no lo manda, queda undefined y no se muestra nada.
   */
  nombre_sub_estado?: string | null;

  // Estados finales
  fecha_real_inst: string | null;
  fecha_rechazo: string | null;
  id_estado_sot: number | null;
  nombre_estado: string | null;
  codigo_estado: string | null;
  comentario_gestion: string | null;

  // Segmentación
  tipo_venta: string | null;

  // Audios
  id_grabador_audios: number;
  grabador_real: string | null;
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

  // Reingreso
  venta_origen: number | null;
  codigo_sec_origen: string | null;
  codigo_sot_origen: string | null;

  codigo_tipo_documento?: string;
  ya_reingresada?: boolean;
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
  cant_decos_adicionales: number;
  cant_repetidores_adicionales: number;
  cliente_papa: string;
  cliente_mama: string;
  numero_instalacion: string;
  cliente_fecha_nacimiento: string;
  cliente_genero: string;
  representante_legal_dni?: string | null;
  representante_legal_nombre?: string | null;
  id_distrito_instalacion: number;
  referencias?: string;
  plano: string;
  direccion_detalle: string;
  coordenadas_gps?: string;
  es_full_claro: boolean;
  score_crediticio?: string;
  id_grabador_audios: number;
  nombre_grabador_externo?: string | null;
  audios: AudioVentaForm[];
  venta_origen?: number | null;
}

export interface UpdateVentaAsesorPayload {
  id_producto?: number;
  tecnologia?: string;
  id_tipo_documento?: number;
  cliente_numero_doc?: string;
  cliente_nombre?: string;
  cliente_telefono?: string;
  cliente_email?: string;
  id_distrito_nacimiento?: number | null;
  cant_decos_adicionales?: number;
  cant_repetidores_adicionales?: number;
  cliente_papa?: string;
  cliente_mama?: string;
  numero_instalacion?: string;
  cliente_fecha_nacimiento?: string;
  cliente_genero?: string;
  representante_legal_dni?: string | null;
  representante_legal_nombre?: string | null;
  id_distrito_instalacion?: number;
  referencias?: string;
  plano?: string;
  direccion_detalle?: string;
  coordenadas_gps?: string;
  es_full_claro?: boolean;
  score_crediticio?: string;
  id_grabador_audios?: number;
  nombre_grabador_externo?: string | null;
  audios?: Partial<AudioVenta>[];
}

export interface UpdateVentaBackofficePayload {
  codigo_sec?: string;
  codigo_sot?: string;
  fecha_visita_programada?: string | null;
  bloque_horario?: string | null;
  id_sub_estado_sot?: number | null;
  id_estado_sot?: number | null;
  fecha_real_inst?: string | null;
  fecha_rechazo?: string | null;
  comentario_gestion?: string | null;
  solicitud_correccion?: boolean;
  permitir_reingreso?: boolean;
  id_estado_audios?: number | null;
  observacion_audios?: string | null;
  audio_subido?: boolean;
  audios?: Partial<AudioVenta>[];
}

// ==========================================
// FILTROS & PAGINACIÓN
// ==========================================

export interface VentaFiltros {
  id_estado_sot?: number | string;
  id_estado_sot__isnull?: boolean;
  id_sub_estado_sot?: number | string;
  id_estado_audios?: number | string;
  id_producto?: number | string;
  id_origen_venta?: number | string;
  tecnologia?: string;
  es_full_claro?: boolean;
  solicitud_correccion?: boolean;
  search?: string;
  /** FIX #2: ordering por fecha. Ej: "fecha_venta" | "-fecha_venta" */
  ordering?: string;
  page?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
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
  pendientes: number;
  en_ejecucion: number;
  atendidas: number;
  rechazadas: number;
  en_correccion: number;
}

// ==========================================
// UBIGEO CASCADA (para form)
// ==========================================

export interface UbigeoCascadaValue {
  departamento_id: number | null;
  provincia_id: number | null;
  distrito_id: number | null;
}
