import { GlobalLoader } from "@/components/GlobalLoader";
import { useAuth } from "@/features/auth/context/useAuth";
import { Navigate, Outlet } from "react-router-dom";

export const PrivateRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading)
    return <GlobalLoader message="Verificando sesión..."></GlobalLoader>;

  return isAuthenticated ? (
    <Outlet></Outlet>
  ) : (
    <Navigate to={"/auth/login"} replace></Navigate>
  );
};
