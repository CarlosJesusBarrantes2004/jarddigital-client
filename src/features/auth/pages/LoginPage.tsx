import { Card } from "@/components/ui/card";
import { Lock } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoginForm } from "../components/LoginForm";
import { authService } from "../services/authService";

export const LoginPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (credentials: any) => {
    setError("");
    setIsLoading(true);

    try {
      await authService.login(credentials);

      const user = await authService.getUserProfile();

      if (user.sucursales?.length > 1) {
        sessionStorage.setItem("pendingUser", JSON.stringify(user));
        navigate("/auth/select-branch");
      } else navigate("/dashboard");
    } catch (error: any) {
      setError("Ocurrió un error durante el login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-4 shadow-inner">
            <Lock className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
            Jard Digital
          </h1>
          <p className="text-slate-500 font-medium">
            Panel de Control Operativo
          </p>
        </div>

        <Card className="p-8 shadow-2xl border-white/20 bg-white/80 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">
            Bienvenido
          </h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium animate-in fade-in zoom-in duration-300">
              ⚠️ {error}
            </div>
          )}

          <LoginForm onSubmit={handleLogin} isLoading={isLoading}></LoginForm>
        </Card>
      </div>
    </div>
  );
};
