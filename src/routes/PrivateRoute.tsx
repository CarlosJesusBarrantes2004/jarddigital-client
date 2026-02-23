import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "@/features/auth/context/useAuth";
import { GlobalLoader } from "@/components/GlobalLoader";

export const PrivateRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <GlobalLoader message="Verificando sesión..." />;

  return isAuthenticated ? <Outlet /> : <Navigate to={"/auth/login"} replace />;
};
