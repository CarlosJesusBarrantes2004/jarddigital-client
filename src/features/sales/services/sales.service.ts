import { api } from "@/api/axios";

import type {
  Venta,
  CreateVentaPayload,
  UpdateVentaAsesorPayload,
  UpdateVentaBackofficePayload,
  VentaFiltros,
  PaginatedResponse,
  EstadoSOT,
  SubEstadoSOT,
  EstadoAudio,
  Producto,
  GrabadorAudio,
  TipoDocumento,
  Departamento,
  Provincia,
  Distrito,
} from "../types/sales.types";

// ── Normalizar respuesta paginada o lista simple ──────────────────────────────
function normalizeList<T>(data: unknown): PaginatedResponse<T> {
  if (Array.isArray(data))
    return {
      count: data.length,
      next: null,
      previous: null,
      results: data as T[],
    };
  const paged = data as PaginatedResponse<T>;
  if (paged?.results !== undefined) return paged;
  return { count: 0, next: null, previous: null, results: [] };
}

// ==========================================
// CLOUDINARY — Upload de audios
// Recomendado sobre AWS S3 para este caso:
// ✓ SDK simple (solo un POST a una URL pública)
// ✓ Sin presigned URLs ni IAM roles complejos
// ✓ Free tier generoso (25GB/mes)
// ✓ URL inmutable por hash del contenido
// ✓ Soporte nativo para audio/mp3
// Para usar: crear cuenta en cloudinary.com,
// ir a Settings > Upload > Add upload preset (unsigned)
// ==========================================

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ?? "";
const CLOUDINARY_UPLOAD_PRESET =
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET ?? "";

export interface CloudinaryUploadResult {
  url: string;
  public_id: string;
  secure_url: string;
}

/**
 * Sube un archivo de audio a Cloudinary y devuelve la URL segura.
 * @param file El archivo MP3 a subir
 * @param onProgress Callback de progreso (0-100)
 */
export async function uploadAudioToCloudinary(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<string> {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error(
      "Configura VITE_CLOUDINARY_CLOUD_NAME y VITE_CLOUDINARY_UPLOAD_PRESET en tu .env",
    );
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("resource_type", "video"); // Cloudinary trata audios como "video"
  formData.append("folder", "audios_ventas");

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`,
    );

    if (onProgress) {
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      });
    }

    xhr.onload = () => {
      if (xhr.status === 200) {
        const result: CloudinaryUploadResult = JSON.parse(xhr.responseText);
        resolve(result.secure_url);
      } else {
        reject(
          new Error(`Error Cloudinary: ${xhr.status} ${xhr.responseText}`),
        );
      }
    };

    xhr.onerror = () => reject(new Error("Error de red al subir a Cloudinary"));
    xhr.send(formData);
  });
}

/**
 * Elimina un audio de Cloudinary dado su public_id.
 * Nota: requiere firma del servidor para delete — se recomienda
 * exponer un endpoint Django que llame a cloudinary.uploader.destroy()
 */
export async function deleteAudioFromCloudinary(
  publicId: string,
): Promise<void> {
  // El borrado firmado se delega al backend para no exponer el API Secret
  await api.post("/sales/audios/delete-cloudinary/", { public_id: publicId });
}

// ==========================================
// VENTAS
// ==========================================

export const salesService = {
  getVentas: async (
    filtros?: VentaFiltros,
  ): Promise<PaginatedResponse<Venta>> => {
    const params = new URLSearchParams();
    if (filtros) {
      Object.entries(filtros).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, String(value));
        }
      });
    }
    const { data } = await api.get(`/sales/ventas/?${params.toString()}`);
    return normalizeList<Venta>(data);
  },

  getVenta: async (id: number): Promise<Venta> => {
    const { data } = await api.get<Venta>(`/sales/ventas/${id}/`);
    return data;
  },

  createVenta: async (payload: CreateVentaPayload): Promise<Venta> => {
    const { data } = await api.post<Venta>("/sales/ventas/", payload);
    return data;
  },

  updateVentaAsesor: async (
    id: number,
    payload: UpdateVentaAsesorPayload,
  ): Promise<Venta> => {
    const { data } = await api.patch<Venta>(`/sales/ventas/${id}/`, payload);
    return data;
  },

  updateVentaBackoffice: async (
    id: number,
    payload: UpdateVentaBackofficePayload,
  ): Promise<Venta> => {
    const { data } = await api.patch<Venta>(`/sales/ventas/${id}/`, payload);
    return data;
  },
};

// ==========================================
// CATÁLOGOS
// ==========================================

export const catalogosService = {
  getEstadosSOT: async (): Promise<EstadoSOT[]> => {
    const { data } = await api.get("/sales/estados-sot/");
    return normalizeList<EstadoSOT>(data).results;
  },
  getSubEstadosSOT: async (): Promise<SubEstadoSOT[]> => {
    const { data } = await api.get("/sales/sub-estados-sot/");
    return normalizeList<SubEstadoSOT>(data).results;
  },
  getEstadosAudio: async (): Promise<EstadoAudio[]> => {
    const { data } = await api.get("/sales/estados-audio/");
    return normalizeList<EstadoAudio>(data).results;
  },
  getProductos: async (): Promise<Producto[]> => {
    const { data } = await api.get("/sales/productos/?activo=true");
    return normalizeList<Producto>(data).results;
  },
  // Actualiza solo esta función dentro de catalogosService
  getGrabadores: async (
    includeId?: number | null,
  ): Promise<GrabadorAudio[]> => {
    const url = includeId
      ? `/sales/grabadores/?include_id=${includeId}`
      : "/sales/grabadores/";
    const { data } = await api.get(url);
    return normalizeList<GrabadorAudio>(data).results;
  },
  getTiposDocumento: async (): Promise<TipoDocumento[]> => {
    const { data } = await api.get("/core/tipos-documento/");
    return normalizeList<TipoDocumento>(data).results;
  },
};

// ==========================================
// UBIGEO
// ==========================================

export const ubigeoService = {
  getDepartamentos: async (): Promise<Departamento[]> => {
    const { data } = await api.get("/ubigeo/departamentos/");
    return normalizeList<Departamento>(data).results;
  },
  getProvincias: async (departamentoId: number): Promise<Provincia[]> => {
    const { data } = await api.get(
      `/ubigeo/provincias/?id_departamento=${departamentoId}`,
    );
    return normalizeList<Provincia>(data).results;
  },
  getDistritos: async (provinciaId: number): Promise<Distrito[]> => {
    const { data } = await api.get(
      `/ubigeo/distritos/?id_provincia=${provinciaId}`,
    );
    return normalizeList<Distrito>(data).results;
  },
  getDistritoConPadres: async (
    distritoId: number,
  ): Promise<{
    departamentoId: number;
    provinciaId: number;
    distritoId: number;
  } | null> => {
    try {
      const { data: distrito } = await api.get<Distrito>(
        `/ubigeo/distritos/${distritoId}/`,
      );
      const { data: provincia } = await api.get<Provincia>(
        `/ubigeo/provincias/${distrito.id_provincia}/`,
      );
      return {
        departamentoId: provincia.id_departamento as number,
        provinciaId: distrito.id_provincia as number,
        distritoId: distrito.id,
      };
    } catch {
      return null;
    }
  },
};
