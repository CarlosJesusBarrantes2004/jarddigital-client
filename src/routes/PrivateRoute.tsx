import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "@/features/auth/context/useAuth";
import { GlobalLoader } from "@/components/GlobalLoader";

export const PrivateRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <GlobalLoader message="Verificando sesión..." />;

  return isAuthenticated ? <Outlet /> : <Navigate to={"/auth/login"} replace />;
};
