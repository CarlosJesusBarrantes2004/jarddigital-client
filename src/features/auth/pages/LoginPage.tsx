import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export const LoginPage = () => {
  const navigate = useNavigate(); // CAMBIO: useNavigate en lugar de useRouter
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Mock data (Se mantiene igual para tus pruebas de JARD DIGITAL)
  const mockUsers: Record<string, any> = {
    "carlos.martinez": {
      id: 1,
      nombre_completo: "Carlos Martínez",
      modalidades: ["CALL", "CAMPO"],
      sucursales: [
        { id: 1, nombre: "Jard Digital - Lima" },
        { id: 2, nombre: "Jard Digital - Chiclayo" },
      ],
    },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const user = mockUsers[username.toLowerCase()];
      if (!user || password !== "demo123") {
        setError("Usuario o contraseña incorrectos");
        setIsLoading(false);
        return;
      }

      // Lógica de redirección adaptada a navigate()
      if (user.sucursales.length > 1) {
        sessionStorage.setItem("pendingUser", JSON.stringify(user));
        navigate("/auth/select-branch");
      } else {
        if (user.modalidades.length > 1) {
          sessionStorage.setItem("pendingUser", JSON.stringify(user));
          sessionStorage.setItem(
            "currentBranch",
            JSON.stringify(user.sucursales[0]),
          );
          navigate("/auth/select-modality");
        } else {
          sessionStorage.setItem("currentUser", JSON.stringify(user));
          sessionStorage.setItem(
            "currentBranch",
            JSON.stringify(user.sucursales[0]),
          );
          sessionStorage.setItem("currentModality", user.modalidades[0]);
          navigate("/dashboard"); // CAMBIO: Redirigir a /dashboard
        }
      }
    } catch (err) {
      setError("Ocurrió un error durante el login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Se mantiene el diseño de v0 que es excelente
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-primary mb-2">Jard Digital</h1>
          <p className="text-muted-foreground">Sistema de Call Center</p>
        </div>

        <Card className="p-8 shadow-xl border-primary/10">
          <h2 className="text-2xl font-bold text-foreground mb-8">
            Iniciar Sesión
          </h2>

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm italic">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Usuario</label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Usuario demo: carlos.martinez"
                  className="pl-10 h-12"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-12" disabled={isLoading}>
              {isLoading ? "Cargando..." : "Entrar"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};
