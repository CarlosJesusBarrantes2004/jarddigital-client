/**
 * Cliente Axios configurado con:
 *  - Interceptor de request: adjunta `Authorization: Bearer <token>` desde sessionStorage.
 *  - Interceptor de response: ante un 401 intenta refrescar el token con
 *    `POST /api/token/refresh/`; si falla, redirige al login.
 *
 * El token de acceso se almacena en sessionStorage bajo la clave `jard:accessToken`.
 * El token de refresco se almacena bajo `jard:refreshToken`.
 * Ambas claves son escritas por `AuthProvider` al hacer login.
 */
import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

export const TOKEN_KEY = "jard:accessToken";
export const REFRESH_TOKEN_KEY = "jard:refreshToken";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ─── Estado de refresco ────────────────────────────────────────────────────
let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

function processRefreshQueue(token: string | null): void {
  refreshQueue.forEach((cb) => cb(token));
  refreshQueue = [];
}

// ─── Request interceptor: adjunta JWT ─────────────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = sessionStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(TOKEN_KEY);
  if (token && config.headers) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor: refresca ante 401 ─────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Solo reintentar en 401 y una vez por petición
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Si ya estamos refrescando, encolar la petición
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push((newToken) => {
          if (!newToken) return reject(error);
          originalRequest.headers = originalRequest.headers ?? {};
          originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
          resolve(api(originalRequest));
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken =
      sessionStorage.getItem(REFRESH_TOKEN_KEY) ??
      localStorage.getItem(REFRESH_TOKEN_KEY);

    if (!refreshToken) {
      isRefreshing = false;
      processRefreshQueue(null);
      // Sin refresh token → redirigir al login
      window.location.href = "/auth/login";
      return Promise.reject(error);
    }

    try {
      // Llamada directa con fetch para evitar el interceptor del propio axios
      const refreshResponse = await fetch(
        `${import.meta.env.VITE_API_URL ?? ""}/token/refresh/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh: refreshToken }),
        },
      );

      if (!refreshResponse.ok) {
        throw new Error(`Refresh failed: ${refreshResponse.status}`);
      }

      const data = (await refreshResponse.json()) as {
        access: string;
        refresh?: string;
      };
      const newAccessToken = data.access;

      // Guardar nuevo access token en el mismo almacenamiento donde estaba
      if (sessionStorage.getItem(REFRESH_TOKEN_KEY)) {
        sessionStorage.setItem(TOKEN_KEY, newAccessToken);
        if (data.refresh) sessionStorage.setItem(REFRESH_TOKEN_KEY, data.refresh);
      } else {
        localStorage.setItem(TOKEN_KEY, newAccessToken);
        if (data.refresh) localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh);
      }

      processRefreshQueue(newAccessToken);

      // Reintentar la petición original con el nuevo token
      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    } catch {
      processRefreshQueue(null);
      // Refresco fallido → limpiar sesión y redirigir
      sessionStorage.clear();
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      window.location.href = "/auth/login";
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  },
);
