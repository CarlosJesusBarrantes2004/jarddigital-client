import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

import { userService } from "../services/userService";
import { userFormSchema, type UserFormValues } from "../schemas/userSchema";
import type {
  CreateUserPayload,
  Role,
  UpdateUserPayload,
  User,
  WorkspaceOption,
} from "../types";
import { Switch } from "@/components/ui/switch";

interface UserFormProps {
  user?: User;
  roles: Role[];
  onSave: (
    data: CreateUserPayload | UpdateUserPayload,
    isSupervisor: boolean,
    selectedWsIds: number[],
  ) => Promise<boolean>;
  onCancel: () => void;
}

// Usamos colores de Tailwind en lugar de Hexadecimales fijos para que se adapten
const ROLE_BADGE: Record<
  string,
  { label: string; colorClass: string; bgClass: string; borderClass: string }
> = {
  DUENO: {
    label: "Dueño",
    colorClass: "text-destructive",
    bgClass: "bg-destructive/10 hover:bg-destructive/20",
    borderClass: "border-destructive/30",
  },
  SUPERVISOR: {
    label: "Supervisor",
    colorClass: "text-blue-500",
    bgClass: "bg-blue-500/10 hover:bg-blue-500/20",
    borderClass: "border-blue-500/30",
  },
  RRHH: {
    label: "RRHH",
    colorClass: "text-orange-500",
    bgClass: "bg-orange-500/10 hover:bg-orange-500/20",
    borderClass: "border-orange-500/30",
  },
  BACKOFFICE: {
    label: "BackOffice",
    colorClass: "text-purple-500",
    bgClass: "bg-purple-500/10 hover:bg-purple-500/20",
    borderClass: "border-purple-500/30",
  },
  ASESOR: {
    label: "Asesor",
    colorClass: "text-emerald-500",
    bgClass: "bg-emerald-500/10 hover:bg-emerald-500/20",
    borderClass: "border-emerald-500/30",
  },
};

export const UserForm = ({ user, roles, onSave, onCancel }: UserFormProps) => {
  const isEditing = !!user;

  const [workspaceOptions, setWorkspaceOptions] = useState<WorkspaceOption[]>(
    [],
  );
  const [loadingWs, setLoadingWs] = useState(true);
  const [selectedWsIds, setSelectedWsIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      nombre_completo: user?.nombre_completo ?? "",
      username: user?.username ?? "",
      email: user?.email ?? "",
      password: "",
      id_rol: user?.id_rol ?? 0,
      activo: user?.activo ?? true,
    },
  });

  const watchedRolId = watch("id_rol");
  const selectedRole = roles.find((r) => r.id === watchedRolId);
  const roleCode = selectedRole?.codigo ?? "";

  const isAdvisor = roleCode === "ASESOR";
  const isSupervisor = roleCode === "SUPERVISOR";
  const isOwner = roleCode === "DUENO";
  const needsWorkspace = !isOwner && watchedRolId !== 0; // Solo pide sede si ya eligió rol y no es dueño

  // ── Cargar opciones de workspace ─────────────
  useEffect(() => {
    userService
      .getWorkspaceOptions()
      .then((opts) => {
        setWorkspaceOptions(opts);
        if (user?.sucursales) {
          setSelectedWsIds(user.sucursales.map((s) => s.id_modalidad_sede));
        } else if (!isEditing && roles.length > 0 && watchedRolId === 0) {
          setValue("id_rol", roles[0].id);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingWs(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Cuando cambia el rol
  useEffect(() => {
    if (isOwner) setSelectedWsIds([]);
    if (isAdvisor && selectedWsIds.length > 1)
      setSelectedWsIds([selectedWsIds[0]]);
  }, [isOwner, isAdvisor]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Toggle de workspace ───────────────────────
  const toggleWorkspace = (wsId: number) => {
    setSelectedWsIds((prev) => {
      if (isAdvisor) return [wsId]; // Asesor: solo 1
      return prev.includes(wsId)
        ? prev.filter((id) => id !== wsId)
        : [...prev, wsId];
    });
  };

  // ── Submit ────────────────────────────────────
  const onSubmit = async (values: UserFormValues) => {
    if (needsWorkspace && selectedWsIds.length === 0) return;

    setIsSubmitting(true);
    const payload: CreateUserPayload | UpdateUserPayload = isEditing
      ? {
          nombre_completo: values.nombre_completo,
          email: values.email,
          id_rol: values.id_rol,
          activo: values.activo,
          ids_modalidades_sede: isOwner ? [] : selectedWsIds,
          ...(values.password ? { password: values.password } : {}),
        }
      : {
          username: values.username,
          nombre_completo: values.nombre_completo,
          email: values.email,
          password: values.password ?? "",
          id_rol: values.id_rol,
          activo: values.activo,
          ids_modalidades_sede: isOwner ? [] : selectedWsIds,
        };

    const ok = await onSave(payload, isSupervisor, selectedWsIds);
    if (!ok) setIsSubmitting(false);
  };

  return (
    <form
      className="flex flex-col gap-6 pb-4 font-sans"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      {/* ── Datos de cuenta ── */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground mb-4">
          Datos de cuenta
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-[0.06em] font-mono">
              Nombre completo
            </label>
            <input
              type="text"
              placeholder="Ej: María García López"
              className={cn(
                "h-11 bg-background border rounded-xl px-3.5 font-sans text-sm text-foreground transition-all outline-none focus:border-primary focus:ring-4 focus:ring-primary/10",
                errors.nombre_completo
                  ? "border-destructive focus:border-destructive focus:ring-destructive/10"
                  : "border-border",
              )}
              {...register("nombre_completo")}
            />
            {errors.nombre_completo && (
              <p className="text-[11px] text-destructive flex items-center gap-1 mt-0.5">
                <AlertCircle size={11} /> {errors.nombre_completo.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-[0.06em] font-mono">
              Username
            </label>
            <input
              type="text"
              placeholder="maria_garcia"
              disabled={isEditing}
              className={cn(
                "h-11 bg-background border rounded-xl px-3.5 font-sans text-sm transition-all outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:opacity-50 disabled:cursor-not-allowed",
                errors.username ? "border-destructive" : "border-border",
                isEditing
                  ? "text-muted-foreground bg-muted"
                  : "text-foreground",
              )}
              {...register("username")}
            />
            {errors.username && (
              <p className="text-[11px] text-destructive flex items-center gap-1 mt-0.5">
                <AlertCircle size={11} /> {errors.username.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-[0.06em] font-mono">
              Email
            </label>
            <input
              type="email"
              placeholder="maria@jard.com"
              className={cn(
                "h-11 bg-background border rounded-xl px-3.5 font-sans text-sm text-foreground transition-all outline-none focus:border-primary focus:ring-4 focus:ring-primary/10",
                errors.email ? "border-destructive" : "border-border",
              )}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-[11px] text-destructive flex items-center gap-1 mt-0.5">
                <AlertCircle size={11} /> {errors.email.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-[0.06em] font-mono">
              {isEditing ? "Nueva contraseña (opcional)" : "Contraseña inicial"}
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className={cn(
                "h-11 bg-background border rounded-xl px-3.5 font-sans text-sm text-foreground transition-all outline-none focus:border-primary focus:ring-4 focus:ring-primary/10",
                errors.password ? "border-destructive" : "border-border",
              )}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-[11px] text-destructive flex items-center gap-1 mt-0.5">
                <AlertCircle size={11} /> {errors.password.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Rol ── */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground mb-4">
          Rol en el sistema
        </p>
        {roles.length === 0 ? (
          <p className="text-[13px] text-muted-foreground/60">
            Sin roles disponibles para asignar.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {roles.map((role) => {
              const meta = ROLE_BADGE[role.codigo];
              const activo = watchedRolId === role.id;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() =>
                    setValue("id_rol", role.id, { shouldValidate: true })
                  }
                  className={cn(
                    "px-4 py-1.5 rounded-full border text-[13px] font-medium transition-all duration-200",
                    activo
                      ? cn(
                          meta?.bgClass,
                          meta?.colorClass,
                          meta?.borderClass,
                          "ring-2 ring-offset-1 ring-offset-card ring-current/20",
                        )
                      : "border-border bg-background text-muted-foreground hover:bg-muted",
                  )}
                >
                  {meta?.label ?? role.nombre}
                </button>
              );
            })}
          </div>
        )}
        {errors.id_rol && (
          <p className="text-[11px] text-destructive flex items-center gap-1 mt-2">
            <AlertCircle size={11} /> {errors.id_rol.message}
          </p>
        )}
      </div>

      {/* ── Workspaces ── */}
      {needsWorkspace && (
        <div className="bg-card border-l-4 border-l-primary border-y border-r border-y-border border-r-border rounded-2xl p-5 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between mb-4">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground m-0">
              Sedes asignadas
            </p>
            {isAdvisor && (
              <span className="text-[10px] font-mono text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-full px-2 py-0.5 uppercase tracking-[0.06em]">
                Solo 1 sede
              </span>
            )}
          </div>

          {loadingWs ? (
            <div className="flex justify-center py-6">
              <Loader2
                className="animate-spin text-muted-foreground"
                size={20}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full">
              {workspaceOptions.map((ws) => {
                const isSelected = selectedWsIds.includes(ws.id);
                return (
                  <div
                    key={ws.id}
                    onClick={() => toggleWorkspace(ws.id)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200",
                      isSelected
                        ? "bg-primary/10 border-primary/30"
                        : "bg-background border-border hover:bg-muted hover:border-primary/20",
                    )}
                  >
                    <div
                      className={cn(
                        "w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors",
                        isSelected
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-muted-foreground/30",
                      )}
                    >
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </div>
                    <div className="flex-1">
                      <span
                        className={cn(
                          "block text-[13px] font-medium transition-colors",
                          isSelected ? "text-primary" : "text-foreground",
                        )}
                      >
                        {ws.etiqueta}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {selectedWsIds.length === 0 && (
            <p className="text-[11px] text-destructive flex items-center gap-1 mt-2">
              <AlertCircle size={11} /> Selecciona al menos una sede
            </p>
          )}
        </div>
      )}

      {/* ── Estado ── */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground mb-4">
          Estado
        </p>
        <div className="flex items-center gap-3">
          <Switch
            checked={watch("activo")}
            onCheckedChange={(val) => setValue("activo", val)}
          />
          <span
            className={cn(
              "text-sm transition-colors",
              watch("activo") ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {watch("activo") ? "Usuario activo" : "Usuario inactivo"}
          </span>
        </div>
      </div>

      {/* ── Acciones ── */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={
            isSubmitting || (needsWorkspace && selectedWsIds.length === 0)
          }
          className="flex-1 h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-sans font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Guardando...
            </>
          ) : isEditing ? (
            "Guardar cambios"
          ) : (
            "Crear colaborador"
          )}
        </button>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={onCancel}
          className="flex-1 h-11 bg-transparent border border-border text-muted-foreground hover:bg-muted hover:text-foreground font-sans font-medium text-sm rounded-xl transition-all"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
};
