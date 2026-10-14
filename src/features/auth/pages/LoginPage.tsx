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
      const rolCodigo = userData.rol?.codigo;

      // ---> CORRECCIÓN: Agregamos RRHH y DUENO al Bypass Global <---
      if (
        rolCodigo === "BACKOFFICE" ||
        rolCodigo === "COORDINADOR" ||
        rolCodigo === "SEGUIMIENTO" ||
        rolCodigo === "RRHH" ||
        rolCodigo === "DUENO"
      ) {
        if (workspaces.length > 0) selectWorkspace(workspaces[0]);
        navigate("/dashboard");
        return;
      }

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
    <main className="relative min-h-[100svh] overflow-hidden bg-slate-50 p-4 font-sans transition-colors duration-300 dark:bg-background sm:p-6 lg:p-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto grid min-h-[calc(100svh-2rem)] w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)] dark:border-border dark:bg-card sm:min-h-[calc(100svh-3rem)] lg:min-h-[680px] lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative hidden overflow-hidden border-r border-slate-200 bg-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600" />
          <div className="px-10 pt-12 xl:px-14">
            <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-700">
              Plataforma comercial
            </span>
            <h2 className="mt-6 max-w-md text-3xl font-semibold leading-tight tracking-tight text-slate-900 xl:text-4xl">
              Todo tu equipo conectado en un solo lugar.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-slate-500">
              Gestiona tus operaciones, productos y resultados de forma clara y segura.
            </p>
          </div>

          <div className="flex flex-1 items-center justify-center px-8 py-8 xl:px-12">
            <img
              src="/images/login.jpeg"
              alt="Jard Digital"
              className="h-auto w-full max-w-[620px] object-contain"
            />
          </div>

          <p className="px-10 pb-8 text-xs text-slate-400 xl:px-14">
            Acceso exclusivo para personal autorizado
          </p>
        </section>

        <section className="flex items-center justify-center bg-background px-5 py-8 dark:bg-card sm:px-10 sm:py-12 lg:px-12 xl:px-16">
          <div className="w-full max-w-[420px] animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8 flex justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm dark:border-border lg:hidden">
              <img
                src="/images/login.jpeg"
                alt="Jard Digital"
                className="h-20 w-full max-w-[260px] object-contain"
              />
            </div>

            <div className="mb-8">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                Jard Digital
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-[2rem]">
                Bienvenido de nuevo
              </h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Ingresa tus credenciales para acceder al sistema.
              </p>
            </div>

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
                className="mt-7 flex h-[52px] w-full items-center justify-center gap-2.5 rounded-xl bg-primary text-[15px] font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-200 hover:-translate-y-[1px] hover:opacity-90 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <div className="h-[18px] w-[18px] animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                ) : (
                  <>
                    <LogIn size={18} /> Entrar al sistema
                  </>
                )}
              </button>
            </form>

            <p className="mt-8 text-center text-xs leading-5 text-muted-foreground/70">
              Si tienes problemas para ingresar, comunícate con el administrador.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};
