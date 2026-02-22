import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import { useState } from "react";
import { loginSchema, type LoginFormValues } from "./schemas/loginSchema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";

interface LoginFormProps {
  onSubmit: (credentials: LoginFormValues) => Promise<void>;
  isLoading: boolean;
}

export const LoginForm = ({ onSubmit, isLoading }: LoginFormProps) => {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Usuario</label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            {...register("username")}
            type="text"
            placeholder="Ej: admin"
            className={cn(
              "pl-10 h-12",
              errors.username &&
                "border-destructive focus-visible:ring-destructive",
            )}
            disabled={isLoading}
          />
        </div>
        {errors.username && (
          <p className="text-xs text-destructive mt-1 font-medium animate-in fade-in">
            {errors.username.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Contraseña
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            {...register("password")}
            type={showPassword ? "text" : "password"}
            placeholder="Tu contraseña secreta"
            className={cn(
              "pl-10 pr-10 h-12",
              errors.password &&
                "border-destructive focus-visible:ring-destructive",
            )}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
            tabIndex={-1} // Evita que el Tab se pare aquí al llenar el form
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-destructive mt-1 font-medium animate-in fade-in">
            {errors.password.message}
          </p>
        )}
      </div>
      <Button
        type="submit"
        className="w-full h-12 text-base font-semibold"
        disabled={isLoading}
      >
        {isLoading ? "Validando credenciales..." : "Entrar al Sistema"}
      </Button>
    </form>
  );
};
