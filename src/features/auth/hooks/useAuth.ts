import { useEffect, useState, useCallback } from "react";
import { authService } from "../services/authService";
import type { User } from "../types";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const userData = await authService.getUserProfile();
      setUser(userData);
      setIsAuthenticated(true);
      return userData;
    } catch (error) {
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return { user, isAuthenticated, loading, checkAuth };
};
