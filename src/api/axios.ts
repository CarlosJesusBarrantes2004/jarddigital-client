/**
 * Cliente Axios configurado con:
 *  - Interceptor de request: adjunta `Authorization: Bearer <token>` desde sessionStorage.
 *  - Interceptor de response: ante un 401 intenta refrescar el token con
 *    `POST /api/token/refresh/`; si falla, redirige al login.
 *
 * El token de acceso se almacena en sessionStorage bajo la clave `jard:accessToken`.
 * El token de refresco se almacena bajo `jard:refreshToken`.
 * Ambas claves son escritas por `AuthProvider` al hacer login.
 *
 * Protección anti-bucle:
 *  - Si la URL de la petición fallida es un endpoint de autenticación sensible
 *    (/token/refresh/, /users/me/, /auth/login/), se limpia el storage y se
 *    rechaza sin redirigir desde el interceptor.
 *  - Si la ruta actual del navegador ya es /auth/login, no se fuerza ninguna
 *    redirección adicional para evitar recargas en bucle.
 *  - La bandera _retry impide reintentar más de una vez la misma petición.
 */
import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

export const TOKEN_KEY = "jard:accessToken";
export const REFRESH_TOKEN_KEY = "jard:refreshToken";

/** URLs de la API cuyo 401 NO debe disparar el flujo de refresco. */
const AUTH_ENDPOINTS = [
  "/token/refresh/",
  "/auth/login/",
] as const;

/** Devuelve true si la URL de la petición es un endpoint sensible de auth. */
function isAuthEndpoint(url: string | undefined): boolean {
  if (!url) return false;
  return AUTH_ENDPOINTS.some((endpoint) => url.includes(endpoint));
}

/** Devuelve true si el navegador ya está en la página de login. */
function isOnLoginPage(): boolean {
  return window.location.pathname.includes("/auth/login") ||
    window.location.pathname.includes("/login");
}

/** Limpia todos los tokens del storage sin redirigir. */
function clearAuthStorage(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/** Redirige a login solo si no estamos ya en esa ruta. */
function redirectToLogin(): void {
  if (!isOnLoginPage()) {
    window.location.href = "/auth/login";
  }
}

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

    // ── No es un error 401: propagar sin más ──────────────────────────────
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // ── Esta petición ya fue reintentada: no volver a intentar ────────────
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    // ── La petición fallida ES un endpoint de autenticación sensible ───────
    // Limpiar tokens y rechazar sin redirigir (evita bucles desde /auth/login/).
    if (isAuthEndpoint(originalRequest.url)) {
      clearAuthStorage();
      return Promise.reject(error);
    }

    // ── Ya estamos en la página de login: limpiar y rechazar silenciosamente ─
    if (isOnLoginPage()) {
      clearAuthStorage();
      return Promise.reject(error);
    }

    // ── Si ya estamos refrescando, encolar esta petición ──────────────────
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push((newToken) => {
          if (!newToken) return reject(error);
          originalRequest.headers = originalRequest.headers ?? {};
          originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
          // Marcar _retry para que si este reintento también da 401 no entre en bucle
          originalRequest._retry = true;
          resolve(api(originalRequest));
        });
      });
    }

    // ── Primera vez que vemos un 401 para esta petición ───────────────────
    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken =
      sessionStorage.getItem(REFRESH_TOKEN_KEY) ??
      localStorage.getItem(REFRESH_TOKEN_KEY);

    if (!refreshToken) {
      isRefreshing = false;
      processRefreshQueue(null);
      clearAuthStorage();
      redirectToLogin();
      return Promise.reject(error);
    }

    try {
      // Llamada directa con fetch para evitar interceptar la propia petición de refresco
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
      // Refresco fallido → limpiar sesión y redirigir (solo si no estamos ya en login)
      clearAuthStorage();
      redirectToLogin();
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  },
);
