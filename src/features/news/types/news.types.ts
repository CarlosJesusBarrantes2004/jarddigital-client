export interface Noticia {
  id: number;
  titulo: string;
  contenido: string;
  imagen_url: string | null;
  id_autor: number | null;
  nombre_autor: string;
  creado_en: string;
  actualizado_en: string;
  activo: boolean;
}

export interface CreateNoticiaPayload {
  titulo: string;
  contenido: string;
  imagen_url?: string | null;
}

export interface UpdateNoticiaPayload {
  titulo?: string;
  contenido?: string;
  imagen_url?: string | null;
}
