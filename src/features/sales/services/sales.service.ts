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
// ==========================================

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ?? "";
const CLOUDINARY_UPLOAD_PRESET =
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET ?? "";

export interface CloudinaryUploadResult {
  url: string;
  public_id: string;
  secure_url: string;
  delete_token?: string;
}

export interface UploadedAudioData {
  url: string;
  deleteToken?: string;
}

export async function uploadAudioToCloudinary(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<UploadedAudioData> {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error(
      "Configura VITE_CLOUDINARY_CLOUD_NAME y VITE_CLOUDINARY_UPLOAD_PRESET en tu .env",
    );
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("resource_type", "video");
  formData.append("folder", "audios_ventas");

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`,
    );

    if (onProgress) {
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable)
          onProgress(Math.round((e.loaded / e.total) * 100));
      });
    }

    xhr.onload = () => {
      if (xhr.status === 200) {
        const result: CloudinaryUploadResult = JSON.parse(xhr.responseText);
        resolve({ url: result.secure_url, deleteToken: result.delete_token });
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

export async function deleteAudioFromCloudinaryDirect(
  deleteToken: string,
): Promise<void> {
  if (!CLOUDINARY_CLOUD_NAME || !deleteToken) return;

  const formData = new FormData();
  formData.append("token", deleteToken);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/delete_by_token`,
    );
    xhr.onload = () => {
      if (xhr.status === 200) resolve();
      else reject(new Error(`Fallo al borrar: ${xhr.responseText}`));
    };
    xhr.onerror = () => reject(new Error("Error de red al intentar borrar"));
    xhr.send(formData);
  });
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

  /**
   * Descarga el reporte Excel de ventas.
   * El backend devuelve un blob .xlsx que abrimos como descarga directa en el navegador.
   *
   * @param fechaInicio  YYYY-MM-DD (opcional). Si no se pasa, exporta todo.
   * @param fechaFin     YYYY-MM-DD (opcional). Si no se pasa, exporta todo.
   */
  exportarExcel: async (
    fechaInicio?: string,
    fechaFin?: string,
    estadoSot?: string, // FIX #6: "ATENDIDO" | "EJECUCION" | "RECHAZADO" | undefined
  ): Promise<void> => {
    const params = new URLSearchParams();
    if (fechaInicio) params.append("fecha_inicio", fechaInicio);
    if (fechaFin) params.append("fecha_fin", fechaFin);
    if (estadoSot) params.append("estado_sot", estadoSot); // ← NUEVO

    const response = await api.get(
      `/sales/ventas/exportar_excel/?${params.toString()}`,
      { responseType: "blob" },
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;

    const contentDisposition = response.headers["content-disposition"] as
      | string
      | undefined;
    const fileNameMatch = contentDisposition?.match(/filename="?([^"]+)"?/);
    link.setAttribute("download", fileNameMatch?.[1] ?? "Reporte_Ventas.xlsx");

    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
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
