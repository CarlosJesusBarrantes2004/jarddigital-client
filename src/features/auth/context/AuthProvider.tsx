import { useCallback, useEffect, useState, type ReactNode } from "react";

import { authService } from "../services/authService";
import { TOKEN_KEY, REFRESH_TOKEN_KEY } from "@/api/axios";

import { AuthContext } from "./AuthContext";

import type { ActiveWorkspace, User, Workspace } from "../types";

export const SESSION_KEY_WORKSPACE = "jard:activeWorkspace";
export const SESSION_KEY_USER = "jard:currentUser";

function persistCurrentUser(userData: User): void {
  sessionStorage.setItem(SESSION_KEY_USER, JSON.stringify(userData));
}

function buildActiveWorkspace(workspace: Workspace): ActiveWorkspace {
  return {
    id_modalidad_sede: workspace.id_modalidad_sede,
    id_sucursal: workspace.id_sucursal,
    nombre_sucursal: workspace.nombre_sucursal,
    id_modalidad: workspace.id_modalidad,
    nombre_modalidad: workspace.nombre_modalidad,
    etiqueta: workspace.etiqueta,
  };
}

function restoreWorkspace(): ActiveWorkspace | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY_WORKSPACE);
    return raw ? (JSON.parse(raw) as ActiveWorkspace) : null;
  } catch {
    return null;
  }
}

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUserState] = useState<User | null>(null);
  const [activeWorkspace, setActiveWorkspace] =
    useState<ActiveWorkspace | null>(restoreWorkspace);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async (): Promise<User | null> => {
    // Guard: si no hay ningún token en storage, no tiene sentido llamar
    // a /users/me/ — daría 401, el interceptor intentaría refrescar, y si
    // tampoco hay refresh token se redirige a /auth/login, causando un
    // bucle de remontajes cuando el usuario ya está en esa ruta.
    const hasToken =
      sessionStorage.getItem(TOKEN_KEY) ??
      localStorage.getItem(TOKEN_KEY) ??
      sessionStorage.getItem(REFRESH_TOKEN_KEY) ??
      localStorage.getItem(REFRESH_TOKEN_KEY);

    if (!hasToken) {
      setIsLoading(false);
      return null;
    }

    try {
      const userData = await authService.getUserProfile();
      setUserState(userData);
      persistCurrentUser(userData);
      return userData;
    } catch {
      setUserState(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!user) return;
    const workspaces = user.sucursales ?? [];

    if (workspaces.length === 1 && !activeWorkspace) {
      const built = buildActiveWorkspace(workspaces[0]);
      setActiveWorkspace(built);
      sessionStorage.setItem(SESSION_KEY_WORKSPACE, JSON.stringify(built));
    }
  }, [user, activeWorkspace]);

  const setUser = (userData: User) => {
    setUserState(userData);
    persistCurrentUser(userData);
  };

  const updateCurrentUser = (updatedData: Partial<User>) => {
    setUserState((prev) => {
      if (!prev) return prev;
      const next: User = { ...prev, ...updatedData };
      persistCurrentUser(next);
      return next;
    });
  };

  const selectWorkspace = (workspace: Workspace) => {
    const built = buildActiveWorkspace(workspace);
    setActiveWorkspace(built);
    sessionStorage.setItem(SESSION_KEY_WORKSPACE, JSON.stringify(built));
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUserState(null);
      setActiveWorkspace(null);
      sessionStorage.clear();
      window.location.href = "/auth/login";
    }
  };

  return (
    <AuthContext
      value={{
        user,
        activeWorkspace,
        isAuthenticated: !!user,
        isLoading,
        setUser,
        updateCurrentUser,
        selectWorkspace,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext>
  );
};
