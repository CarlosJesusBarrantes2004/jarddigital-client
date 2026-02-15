import { useCallback, useEffect, useState } from "react";
import type { Branch, User } from "../types";
import { authService } from "../services/authService";
import { AuthContext } from "./AuthContext";

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [currentBranch, setCurrentBranch] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [currentModality, setCurrentModality] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedBranch = sessionStorage.getItem("currentBranch");
    const savedModality = sessionStorage.getItem("currentModality");
    if (savedBranch) setCurrentBranch(JSON.parse(savedBranch));
    if (savedModality) setCurrentModality(JSON.parse(savedModality));
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const userData = await authService.getUserProfile();
      setUser(userData);
      return userData;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = (userData: User) => setUser(userData);

  const selectBranch = (branch: Branch) => {
    const branchData = { id: branch.id_sucursal, name: branch.nombre_sucursal };
    const modalityData = {
      id: branch.id_modalidad,
      name: branch.nombre_modalidad,
    };
    setCurrentBranch(branchData);
    setCurrentModality(modalityData);
    sessionStorage.setItem("currentBranch", JSON.stringify(branchData));
    sessionStorage.setItem("currentModality", JSON.stringify(modalityData));
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setCurrentBranch(null);
      setCurrentModality(null);
      sessionStorage.clear();
      window.location.href = "/auth/login";
    }
  };

  return (
    <AuthContext
      value={{
        user,
        currentBranch,
        currentModality,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
        selectBranch,
        checkAuth,
      }}
    >
      {children}
    </AuthContext>
  );
};
