import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  Check,
  DollarSign,
  Loader2,
  Lock,
  ShieldAlert,
} from "lucide-react";
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
import type { User as AuthUser } from "@/features/auth/types";
import { Switch } from "@/components/ui/switch";
import { SESSION_KEY_WORKSPACE } from "@/features/auth/context/AuthProvider";

// Tipo que representa una asignación activa conflictiva
interface ConflictingAssignment {
  wsId: number;
  assignmentId: number;
  nombreSupervisor: string;
  resolved: boolean; // true cuando el usuario ya la desactivó
}

interface UserFormProps {
  user?: User;
  roles: Role[];
  currentUser: AuthUser | null;
  onSave: (
    data: CreateUserPayload | UpdateUserPayload,
    isSupervisor: boolean,
    selectedWsIds: number[],
  ) => Promise<boolean>;
  onCancel: () => void;
  // Ahora devuelve la asignación completa o null
  checkActiveSupervisorAssignment?: (
    wsId: number,
    excludeUserId?: number,
  ) => Promise<{
    id: number;
    id_supervisor: number;
    nombre_supervisor: string;
  } | null>;
  deactivateSupervisorAssignment?: (assignmentId: number) => Promise<void>;
}

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
  COORDINADOR: {
    label: "Coordinador",
    colorClass: "text-violet-500",
    bgClass: "bg-violet-500/10 hover:bg-violet-500/20",
    borderClass: "border-violet-500/30",
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

export const UserForm = ({
  user,
  roles,
  currentUser,
  onSave,
  onCancel,
  checkActiveSupervisorAssignment,
  deactivateSupervisorAssignment,
}: UserFormProps) => {
  const isEditing = !!user;

  const [rawWorkspaceOptions, setRawWorkspaceOptions] = useState<
    WorkspaceOption[]
  >([]);
  const [loadingWs, setLoadingWs] = useState(true);
  const [selectedWsIds, setSelectedWsIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Conflictos: lista de asignaciones activas que colisionan con las sedes seleccionadas
  const [conflicts, setConflicts] = useState<ConflictingAssignment[]>([]);
  const [resolvingId, setResolvingId] = useState<number | null>(null); // assignmentId en proceso

  const [showRemoveSupervisorWarning, setShowRemoveSupervisorWarning] =
    useState(false);

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
      dni: user?.dni ?? "",
      celular: user?.celular ?? "",
      password: "",
      id_rol: user?.id_rol ?? 0,
      activo: user?.activo ?? true,
      // Mapeo seguro con Optional Chaining desde el backend
      sueldo_base_part_time: user?.perfil_laboral?.sueldo_base_part_time ?? "",
      fecha_inicio_contrato: user?.perfil_laboral?.fecha_inicio_contrato ?? "",
    },
  });

  const watchedRolId = watch("id_rol");
  const watchedActivo = watch("activo");
  const selectedRole = roles.find((r) => r.id === watchedRolId);
  const roleCode = selectedRole?.codigo ?? "";
  const isAdvisor = roleCode === "ASESOR";
  const isSupervisor = roleCode === "SUPERVISOR";
  const isOwner = roleCode === "DUENO";
  const needsWorkspace = !isOwner && watchedRolId !== 0;

  const originalRoleCode = useMemo(() => {
    if (!user || !roles.length) return "";
    return roles.find((r) => r.id === user.id_rol)?.codigo ?? "";
  }, [user, roles]);

  const wasSupervior = originalRoleCode === "SUPERVISOR";

  useEffect(() => {
    if (!isEditing || !wasSupervior) {
      setShowRemoveSupervisorWarning(false);
      return;
    }
    setShowRemoveSupervisorWarning(!isSupervisor || watchedActivo === false);
  }, [isEditing, wasSupervior, isSupervisor, watchedActivo]);

  useEffect(() => {
    if (
      !isSupervisor ||
      !checkActiveSupervisorAssignment ||
      selectedWsIds.length === 0
    ) {
      setConflicts([]);
      return;
    }

    let cancelled = false;
    (async () => {
      const nuevosConflictos: ConflictingAssignment[] = [];
      for (const wsId of selectedWsIds) {
        const assignment = await checkActiveSupervisorAssignment(
          wsId,
          user?.id,
        );
        if (assignment) {
          const previo = conflicts.find((c) => c.wsId === wsId);
          nuevosConflictos.push({
            wsId,
            assignmentId: assignment.id,
            nombreSupervisor: assignment.nombre_supervisor,
            resolved:
              previo?.assignmentId === assignment.id ? previo.resolved : false,
          });
        }
      }
      if (!cancelled) setConflicts(nuevosConflictos);
    })();

    return () => {
      cancelled = true;
    };
  }, [isSupervisor, selectedWsIds, checkActiveSupervisorAssignment, user?.id]);

  const unresolvedConflicts = conflicts.filter((c) => !c.resolved);
  const hasBlockingConflicts = unresolvedConflicts.length > 0;

  const handleResolveConflict = async (conflict: ConflictingAssignment) => {
    if (!deactivateSupervisorAssignment) return;
    setResolvingId(conflict.assignmentId);
    try {
      await deactivateSupervisorAssignment(conflict.assignmentId);
      setConflicts((prev) =>
        prev.map((c) =>
          c.assignmentId === conflict.assignmentId
            ? { ...c, resolved: true }
            : c,
        ),
      );
    } catch {
      console.error("Error al desactivar asignación anterior");
    } finally {
      setResolvingId(null);
    }
  };

  const isRestrictedUser =
    currentUser?.rol?.codigo === "SUPERVISOR" ||
    currentUser?.rol?.codigo === "RRHH";

  const activeSessionSede = useMemo(() => {
    try {
      const item = sessionStorage.getItem(SESSION_KEY_WORKSPACE);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }, []);

  const activeWsId = activeSessionSede?.id_modalidad_sede;

  const workspaceOptions = useMemo(() => {
    if (currentUser?.rol?.codigo === "DUENO") return rawWorkspaceOptions;
    const sedesPermitidasIds =
      currentUser?.sucursales?.map((s) => s.id_modalidad_sede) || [];
    return rawWorkspaceOptions.filter((ws) =>
      sedesPermitidasIds.includes(ws.id),
    );
  }, [rawWorkspaceOptions, currentUser]);

  useEffect(() => {
    userService
      .getWorkspaceOptions()
      .then((opts) => {
        setRawWorkspaceOptions(opts);
        if (user?.sucursales) {
          setSelectedWsIds(user.sucursales.map((s) => s.id_modalidad_sede));
        } else {
          if (roles.length > 0 && watchedRolId === 0)
            setValue("id_rol", roles[0].id);
          if (isRestrictedUser && activeWsId) setSelectedWsIds([activeWsId]);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingWs(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isOwner) setSelectedWsIds([]);
    else if (isRestrictedUser && activeWsId && !isEditing)
      setSelectedWsIds([activeWsId]);
    else if (isAdvisor && selectedWsIds.length > 1)
      setSelectedWsIds([selectedWsIds[0]]);
  }, [isOwner, isAdvisor, isRestrictedUser, activeWsId, isEditing]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleWorkspace = (wsId: number) => {
    setSelectedWsIds((prev) => {
      if (isAdvisor) return [wsId];
      return prev.includes(wsId)
        ? prev.filter((id) => id !== wsId)
        : [...prev, wsId];
    });
  };

  const onSubmit = async (values: UserFormValues) => {
    if (hasBlockingConflicts) return;
    if (needsWorkspace && selectedWsIds.length === 0) return;

    setIsSubmitting(true);
    const celularFinal = values.celular?.trim() || null;
    const dniFinal = values.dni?.trim() || null;

    // Construcción del objeto anidado o null según la nota técnica del backend
    const perfilLaboralFinal =
      values.sueldo_base_part_time || values.fecha_inicio_contrato
        ? {
            sueldo_base_part_time: values.sueldo_base_part_time
              ? Number(values.sueldo_base_part_time).toFixed(2)
              : "0.00",
            fecha_inicio_contrato: values.fecha_inicio_contrato || null,
          }
        : null;

    const basePayload = {
      username: values.username,
      nombre_completo: values.nombre_completo,
      email: values.email,
      dni: dniFinal,
      celular: celularFinal,
      id_rol: values.id_rol,
      activo: values.activo,
      ids_modalidades_sede: isOwner ? [] : selectedWsIds,
      perfil_laboral: perfilLaboralFinal, // Inyección de datos financieros
    };

    const payload = isEditing
      ? {
          ...basePayload,
          ...(values.password ? { password: values.password } : {}),
        }
      : { ...basePayload, password: values.password ?? "" };

    const ok = await onSave(payload, isSupervisor, selectedWsIds);
    if (!ok) setIsSubmitting(false);
  };

  const getNombreSede = (wsId: number) =>
    workspaceOptions.find((ws) => ws.id === wsId)?.etiqueta ?? `Sede #${wsId}`;

  return (
    <form
      className="flex flex-col gap-6 pb-4 font-sans"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      {showRemoveSupervisorWarning && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
              Atención: cambio de rol supervisor
            </p>
            <p className="text-[12px] text-amber-600/80 dark:text-amber-400/80 mt-1 leading-relaxed">
              Al guardar, todas las asignaciones activas de este supervisor
              serán <strong>cerradas automáticamente</strong> con fecha de hoy.
            </p>
          </div>
        </div>
      )}

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
              Nombre de usuario
            </label>
            <input
              type="text"
              placeholder="carlos_b"
              className={cn(
                "h-11 bg-background border rounded-xl px-3.5 font-sans text-sm transition-all outline-none focus:border-primary focus:ring-4 focus:ring-primary/10",
                errors.username ? "border-destructive" : "border-border",
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:col-span-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-[0.06em] font-mono flex items-center gap-1">
                DNI
              </label>
              <input
                type="text"
                placeholder="Ej: 71234567"
                maxLength={8}
                className={cn(
                  "h-11 bg-background border rounded-xl px-3.5 font-sans text-sm text-foreground transition-all outline-none focus:border-primary focus:ring-4 focus:ring-primary/10",
                  errors.dni
                    ? "border-destructive focus:border-destructive"
                    : "border-border",
                )}
                {...register("dni")}
              />
              {errors.dni && (
                <p className="text-[11px] text-destructive flex items-center gap-1 mt-0.5">
                  <AlertCircle size={11} /> {errors.dni.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-[0.06em] font-mono flex items-center gap-1">
                Celular
                <span className="text-muted-foreground/50 text-[10px] normal-case font-sans tracking-normal ml-1">
                  (para WhatsApp)
                </span>
              </label>
              <input
                type="tel"
                placeholder="Ej: 987654321"
                maxLength={9}
                className={cn(
                  "h-11 bg-background border rounded-xl px-3.5 font-sans text-sm text-foreground transition-all outline-none focus:border-primary focus:ring-4 focus:ring-primary/10",
                  errors.celular
                    ? "border-destructive focus:border-destructive"
                    : "border-border",
                )}
                {...register("celular")}
              />
              {errors.celular ? (
                <p className="text-[11px] text-destructive flex items-center gap-1 mt-0.5">
                  <AlertCircle size={11} /> {errors.celular.message}
                </p>
              ) : (
                <p className="text-[10px] text-muted-foreground/60 mt-0.5 leading-tight">
                  Se usa para enviar el guión de grabación.
                </p>
              )}
            </div>
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

      {/* ── NUEVA SECCIÓN: Perfil Laboral (Módulo Finanzas) ── */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm border-l-4 border-l-blue-500">
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-blue-600 dark:text-blue-400 mb-4">
          Perfil Laboral (Módulo Finanzas)
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-[0.06em] font-mono flex items-center gap-1">
              <DollarSign size={12} /> Sueldo Base Part-Time
            </label>
            <input
              type="text"
              placeholder="Ej: 950.00"
              className={cn(
                "h-11 bg-background border rounded-xl px-3.5 font-sans text-sm text-foreground transition-all outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10",
                errors.sueldo_base_part_time
                  ? "border-destructive"
                  : "border-border",
              )}
              {...register("sueldo_base_part_time")}
            />
            {errors.sueldo_base_part_time && (
              <p className="text-[11px] text-destructive flex items-center gap-1 mt-0.5">
                <AlertCircle size={11} /> {errors.sueldo_base_part_time.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-[0.06em] font-mono flex items-center gap-1">
              <Calendar size={12} /> Fecha Inicio de Contrato
            </label>
            <input
              type="date"
              className={cn(
                "h-11 bg-background border rounded-xl px-3.5 font-sans text-sm text-foreground transition-all outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10",
                errors.fecha_inicio_contrato
                  ? "border-destructive"
                  : "border-border",
              )}
              {...register("fecha_inicio_contrato")}
            />
            {errors.fecha_inicio_contrato && (
              <p className="text-[11px] text-destructive flex items-center gap-1 mt-0.5">
                <AlertCircle size={11} /> {errors.fecha_inicio_contrato.message}
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
            <div>
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-foreground m-0">
                Sedes asignadas
              </p>
              {isRestrictedUser && !isEditing && (
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Asignación fija para tu sesión actual.
                </p>
              )}
            </div>
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
                const isLocked = isRestrictedUser && !isEditing;
                const conflict = isSupervisor
                  ? conflicts.find((c) => c.wsId === ws.id)
                  : undefined;
                const hasUnresolvedConflict = !!conflict && !conflict.resolved;
                const hasResolvedConflict = !!conflict && conflict.resolved;

                return (
                  <div
                    key={ws.id}
                    onClick={() => {
                      if (!isLocked) toggleWorkspace(ws.id);
                    }}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border transition-all duration-200",
                      hasUnresolvedConflict
                        ? "bg-amber-500/5 border-amber-500/30"
                        : hasResolvedConflict
                          ? "bg-emerald-500/5 border-emerald-500/30"
                          : isSelected
                            ? "bg-primary/10 border-primary/30"
                            : "bg-background border-border",
                      isLocked
                        ? "cursor-not-allowed opacity-60"
                        : "cursor-pointer hover:bg-muted hover:border-primary/20",
                    )}
                  >
                    <div
                      className={cn(
                        "w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors",
                        hasUnresolvedConflict
                          ? "bg-amber-500/20 border-amber-500"
                          : hasResolvedConflict
                            ? "bg-emerald-500/20 border-emerald-500"
                            : isSelected
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-muted-foreground/30",
                      )}
                    >
                      {hasUnresolvedConflict ? (
                        <AlertTriangle size={11} className="text-amber-500" />
                      ) : hasResolvedConflict ? (
                        <Check
                          size={12}
                          strokeWidth={3}
                          className="text-emerald-600"
                        />
                      ) : isSelected ? (
                        <Check size={12} strokeWidth={3} />
                      ) : null}
                    </div>
                    <div className="flex-1 flex justify-between items-center min-w-0">
                      <div className="min-w-0">
                        <span
                          className={cn(
                            "block text-[13px] font-medium transition-colors truncate",
                            hasUnresolvedConflict
                              ? "text-amber-600 dark:text-amber-400"
                              : hasResolvedConflict
                                ? "text-emerald-600 dark:text-emerald-400"
                                : isSelected
                                  ? "text-primary"
                                  : "text-foreground",
                          )}
                        >
                          {ws.etiqueta}
                        </span>
                        {hasUnresolvedConflict && conflict && (
                          <span className="text-[10px] text-amber-600/80 dark:text-amber-400/80 font-mono">
                            Supervisor activo: {conflict.nombreSupervisor}
                          </span>
                        )}
                        {hasResolvedConflict && (
                          <span className="text-[10px] text-emerald-600/80 font-mono">
                            Supervisor anterior dado de baja ✓
                          </span>
                        )}
                      </div>
                      {isLocked && isSelected && (
                        <Lock size={12} className="text-primary/50 shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })}
              {workspaceOptions.length === 0 && (
                <p className="text-[12px] text-muted-foreground text-center py-4 bg-muted/50 rounded-lg">
                  No tienes sedes asignadas para otorgar acceso.
                </p>
              )}
            </div>
          )}

          {selectedWsIds.length === 0 && workspaceOptions.length > 0 && (
            <p className="text-[11px] text-destructive flex items-center gap-1 mt-2">
              <AlertCircle size={11} /> Selecciona al menos una sede
            </p>
          )}

          {isSupervisor && conflicts.length > 0 && (
            <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/5 overflow-hidden animate-in fade-in duration-200">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-amber-500/20">
                <ShieldAlert size={14} className="text-amber-500 shrink-0" />
                <p className="text-[12px] font-semibold text-amber-600 dark:text-amber-400">
                  {unresolvedConflicts.length > 0
                    ? `Hay ${unresolvedConflicts.length === 1 ? "un supervisor activo" : `${unresolvedConflicts.length} supervisores activos`} — acción requerida`
                    : "Conflictos resueltos — puedes guardar"}
                </p>
              </div>
              <div className="divide-y divide-amber-500/10">
                {conflicts.map((conflict) => (
                  <div
                    key={conflict.assignmentId}
                    className={cn(
                      "flex items-center justify-between gap-3 px-4 py-3 transition-colors",
                      conflict.resolved ? "opacity-60" : "",
                    )}
                  >
                    <div className="min-w-0">
                      <p className="text-[12px] font-medium text-foreground truncate">
                        {getNombreSede(conflict.wsId)}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Supervisor actual:{" "}
                        <span className="font-medium">
                          {conflict.nombreSupervisor}
                        </span>
                      </p>
                    </div>
                    {conflict.resolved ? (
                      <span className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-2.5 py-1">
                        <Check size={11} strokeWidth={3} /> Dado de baja
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={resolvingId === conflict.assignmentId}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResolveConflict(conflict);
                        }}
                        className={cn(
                          "shrink-0 h-8 px-3 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap",
                          resolvingId === conflict.assignmentId
                            ? "opacity-50 cursor-not-allowed border-border text-muted-foreground"
                            : "bg-amber-500/10 border-amber-500/40 text-amber-700 dark:text-amber-400 hover:bg-amber-500 hover:text-white hover:border-amber-500",
                        )}
                      >
                        {resolvingId === conflict.assignmentId ? (
                          <Loader2 size={11} className="animate-spin" />
                        ) : null}
                        Dar de baja y continuar
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {unresolvedConflicts.length > 0 && (
                <div className="px-4 py-2.5 bg-amber-500/5 border-t border-amber-500/20">
                  <p className="text-[10px] text-amber-600/70 dark:text-amber-400/70 leading-relaxed">
                    Da de baja al supervisor actual para poder registrar el
                    nuevo. Esto cierra su asignación con fecha de hoy.
                  </p>
                </div>
              )}
            </div>
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
            checked={watchedActivo}
            onCheckedChange={(val) => setValue("activo", val)}
          />
          <span
            className={cn(
              "text-sm transition-colors",
              watchedActivo ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {watchedActivo ? "Usuario activo" : "Usuario inactivo"}
          </span>
        </div>
      </div>

      {/* ── Acciones ── */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={
            isSubmitting ||
            (needsWorkspace && selectedWsIds.length === 0) ||
            hasBlockingConflicts
          }
          className="flex-1 h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-sans font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Guardando...
            </>
          ) : hasBlockingConflicts ? (
            "Resuelve los conflictos primero"
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
