import { Card } from "@/components/ui/card";
import { Lock } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoginForm } from "../components/form/LoginForm";
import { authService } from "../services/authService";
import { useAuth } from "../context/useAuth";
import type { LoginFormValues } from "../components/form/schemas/loginSchema";
import { toast } from "sonner";

export const LoginPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const { checkAuth } = useAuth();

  const handleLogin = async (credentials: LoginFormValues) => {
    setIsLoading(true);

    try {
      await authService.login(credentials);
      const user = await checkAuth();

      if (!user) throw new Error("No se pudo obtener el perfil del usuario");

      if (user.rol.codigo === "DUENO") {
        navigate("/dashboard");
        return;
      }

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
        toast.error("Acceso denegado: El usuario no tiene sedes asignadas.");
      }
    } catch (error) {
      const errorMsg =
        error.response?.data?.detail ||
        error.response?.data?.error ||
        "Credenciales incorrectas o error de conexión.";

      console.error("⛔ Error de Auth:", error.response?.data || error.message);

      // Lanzamos el Toast de error
      toast.error(errorMsg);
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

          <LoginForm onSubmit={handleLogin} isLoading={isLoading} />
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-8">
          © 2026 Jard Digital. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
};
