import { useCallback, useEffect, useState, type ReactNode } from "react";

import { authService } from "../services/authService";

import { AuthContext } from "./AuthContext";

import type { ActiveWorkspace, User, Workspace } from "../types";

const SESSION_KEY_WORKSPACE = "jard:activeWorkspace";

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
    try {
      const userData = await authService.getUserProfile();
      setUserState(userData);
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

  const setUser = (userData: User) => setUserState(userData);

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
        selectWorkspace,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext>
  );
};
