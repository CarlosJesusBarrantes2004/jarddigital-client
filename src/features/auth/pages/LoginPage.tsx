import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { loginSchema, type LoginFormValues } from "../schemas/loginSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { authService } from "../services/authService";
import { toast } from "sonner";
import { extractApiError } from "@/lib/api-errors";
import { AlertCircle, Eye, EyeOff, Lock, LogIn, User } from "lucide-react";

export const LoginPage = () => {
  const navigate = useNavigate();
  const { setUser, selectWorkspace } = useAuth();
  const [showPass, setShowPass] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      await authService.login(values);
      const userData = await authService.getUserProfile();
      setUser(userData);

      const workspaces = userData.sucursales ?? [];

      if (workspaces.length === 0) {
        navigate("/dashboard");
      } else if (workspaces.length === 1) {
        selectWorkspace(workspaces[0]);
        navigate("/dashboard");
      } else {
        navigate("/auth/select-workspace");
      }
    } catch (error) {
      toast.error(extractApiError(error));
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background font-sans overflow-hidden transition-colors duration-300">
      {/* Fondo Atmosférico (Se adapta al modo claro/oscuro) */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[30%] left-[20%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full mix-blend-screen dark:mix-blend-lighten" />
        <div className="absolute bottom-[20%] right-[20%] w-[40%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full mix-blend-screen dark:mix-blend-lighten" />
        {/* Grilla Sutil */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]"
          style={{
            backgroundImage:
              "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />
      </div>

      {/* Tarjeta Glassmorphism */}
      <div className="relative z-10 w-full max-w-[420px] mx-6 bg-background/60 dark:bg-card/40 border border-border/50 backdrop-blur-xl rounded-[20px] p-10 md:p-12 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img
            src="/logo-login.png"
            alt="Jard Digital"
            className="h-[70px] object-contain drop-shadow-md"
          />
        </div>

        {/* Titular */}
        <div className="mb-8">
          <h1 className="font-serif text-[1.75rem] font-bold text-foreground leading-[1.2] mb-1.5">
            Bienvenido
            <br />
            de nuevo
          </h1>
          <p className="text-[0.85rem] text-muted-foreground font-light">
            Ingresa tus credenciales para continuar
          </p>
        </div>

        {/* Formulario */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-5"
        >
          <div>
            <label
              htmlFor="username"
              className="block text-[11px] font-mono font-medium text-muted-foreground uppercase tracking-[0.08em] mb-2"
            >
              Usuario
            </label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                id="username"
                type="text"
                autoComplete="username"
                placeholder="tu_usuario"
                disabled={isSubmitting}
                className={`w-full h-[50px] bg-background/50 border border-border rounded-xl pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all ${errors.username ? "border-destructive focus:border-destructive focus:ring-destructive/10" : ""}`}
                {...register("username")}
              />
            </div>
            {errors.username && (
              <p className="flex items-center gap-1.5 text-[11px] text-destructive mt-1.5 animate-in fade-in">
                <AlertCircle size={12} /> {errors.username.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-[11px] font-mono font-medium text-muted-foreground uppercase tracking-[0.08em] mb-2"
            >
              Contraseña
            </label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                id="password"
                type={showPass ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                disabled={isSubmitting}
                className={`w-full h-[50px] bg-background/50 border border-border rounded-xl pl-11 pr-12 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all ${errors.password ? "border-destructive focus:border-destructive focus:ring-destructive/10" : ""}`}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                tabIndex={-1}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-[52px] mt-7 bg-primary text-primary-foreground font-medium text-[15px] rounded-xl flex items-center justify-center gap-2.5 transition-all duration-200 hover:opacity-90 hover:-translate-y-[1px] shadow-lg shadow-primary/25 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="w-[18px] h-[18px] border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <>
                <LogIn size={18} /> Entrar al Sistema
              </>
            )}
          </button>
        </form>

        {/*<div className="absolute bottom-6 right-8 font-mono text-[10px] text-muted-foreground/50 tracking-[0.1em] uppercase">
          v2.0 · JARD
        </div>*/}
      </div>
    </div>
  );
};
