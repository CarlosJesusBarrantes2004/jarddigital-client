import { AxiosError } from "axios";

export const extractApiError = (error: unknown): string => {
  // Si no es un error de Axios, devolvemos un mensaje genérico
  if (!(error instanceof Error) || !("isAxiosError" in error)) {
    return "Ocurrió un error inesperado.";
  }

  const axiosError = error as AxiosError<any>;

  // Si no hay respuesta (ej. el servidor de Django está apagado)
  if (!axiosError.response) {
    return "No se pudo conectar con el servidor. Verifica tu conexión.";
  }

  const data = axiosError.response.data;

  // 1. Caso: Errores simples de DRF o personalizados (detail, error, message)
  if (data?.detail && typeof data.detail === "string") return data.detail;
  if (data?.error && typeof data.error === "string") return data.error;
  if (data?.message && typeof data.message === "string") return data.message;

  // 2. Caso: Errores de validación de Serializers de Django (Diccionarios con Arrays)
  // Ej: { nombre: ["Este campo es requerido"], direccion: ["Muy corto"] }
  if (data && typeof data === "object") {
    // Tomamos la primera llave que falló para no saturar al usuario con 10 errores a la vez
    const firstKey = Object.keys(data)[0];

    if (firstKey) {
      const firstError = data[firstKey];

      // Si el valor es un array de strings (típico de Django)
      if (Array.isArray(firstError) && firstError.length > 0) {
        // Formateamos para que se lea: "nombre: Este campo es requerido"
        return `${firstKey.toUpperCase()}: ${firstError[0]}`;
      }

      // Si el valor es un string directo
      if (typeof firstError === "string") {
        return `${firstKey.toUpperCase()}: ${firstError}`;
      }
    }
  }

  // 3. Fallback final si la estructura es irreconocible
  return "Error al procesar la solicitud en el servidor.";
};
