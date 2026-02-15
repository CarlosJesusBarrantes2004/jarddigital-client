import { Card } from "@/components/ui/card";
import { Lock } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoginForm } from "../components/LoginForm";
import { authService } from "../services/authService";
import { useAuth } from "../context/useAuth";

export const LoginPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { checkAuth } = useAuth();

  const handleLogin = async (credentials: any) => {
    setError("");
    setIsLoading(true);

    try {
      await authService.login(credentials);
      const user = await checkAuth();

      console.log(user);

      if (!user) throw new Error("No se pudo obtener el perfil del usuario");

      if (user.sucursales && user.sucursales.length > 1) {
        sessionStorage.setItem("pendingUser", JSON.stringify(user));
        navigate("/auth/select-branch");
      } else if (user.sucursales && user.sucursales.length === 1) {
        const branch = user.sucursales[0];

        sessionStorage.setItem(
          "currentBranch",
          JSON.stringify({
            id: branch.id_sucursal,
            name: branch.nombre_sucursal,
          }),
        );
        sessionStorage.setItem(
          "currentModality",
          JSON.stringify({
            id: branch.id_modalidad,
            name: branch.nombre_modalidad,
          }),
        );

        navigate("/dashboard");
      } else {
        setError("El usuario no tiene sucursales asignadas");
      }
    } catch (error: any) {
      setError("Error en la autenticación");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 shadow-sm">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-primary mb-2 tracking-tight">
            Jard Digital
          </h1>
          <p className="text-muted-foreground font-medium">
            Sistema de Call Center
          </p>
        </div>

        <Card className="p-8 shadow-xl border-primary/10 bg-card/80 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-foreground mb-8">
            Iniciar Sesión
          </h2>

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm font-medium animate-in fade-in zoom-in duration-300">
              ⚠️ {error}
            </div>
          )}

          <LoginForm onSubmit={handleLogin} isLoading={isLoading} />
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-8">
          © 2026 Jard Digital. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
};
