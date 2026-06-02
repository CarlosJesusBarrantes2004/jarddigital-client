export interface AsistenciaRecord {
  id: number;
  id_usuario: number;
  nombre_asesor: string;
  fecha: string;
  asistio: boolean | null;
}

export interface AttendanceUser {
  id: number;
  nombre_completo: string;
  id_rol: number;
  rol?: {
    id: number;
    codigo: string;
    nombre: string;
  };
  sucursales?: {
    id_modalidad_sede: number;
    id_sucursal: number;
    nombre_sucursal: string;
    id_modalidad: number;
    nombre_modalidad: string;
  }[];
}

export interface RolSistema {
  id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
}

export interface ModalidadSede {
  id: number;
  nombre_sucursal: string;
  nombre_modalidad: string;
  id_sucursal: number;
  id_modalidad: number;
}

export interface AsistenciaItemPayload {
  id_usuario: number;
  fecha: string;
  asistio: boolean | null;
}

export interface SaveAsistenciaMasivaPayload {
  id_sucursal: number;
  asistencias: AsistenciaItemPayload[];
}

// Filtros que se pueden aplicar en la grilla de asistencia
export interface AttendanceFilters {
  mes: number;
  anio: number;
  id_sucursal?: number | null;
  modalidad_sede?: number | null;
  rol?: string | null;
}
