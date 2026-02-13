import { useAuth } from "@/features/auth/hooks/useAuth";
import { Navigate, Outlet } from "react-router-dom";

export const PrivateRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading)
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
      </div>
    );

  return isAuthenticated ? (
    <Outlet></Outlet>
  ) : (
    <Navigate to={"/auth/login"} replace></Navigate>
  );
};
