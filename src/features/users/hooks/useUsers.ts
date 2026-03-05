import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/features/auth/context/useAuth";
import { userService } from "../services/userService";
import type {
  CreateUserPayload,
  Role,
  UpdateUserPayload,
  User,
  UserFilters,
  WorkspaceOption,
} from "../types";

export const useUsers = () => {
  const { user: currentUser, activeWorkspace } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [workspaceOptions, setWorkspaceOptions] = useState<WorkspaceOption[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(false);

  const [filters, setFilters] = useState<UserFilters>({
    search: "",
    id_rol: undefined,
    id_modalidad_sede: undefined,
  });

  // ── Carga inicial de catálogos ────────────────

  const fetchRoles = useCallback(async () => {
    try {
      const allRoles = await userService.getRoles();
      const currentCode = currentUser?.rol?.codigo;

      let available = allRoles.filter((r) => r.codigo !== "DUENO");

      if (currentCode === "SUPERVISOR") {
        available = available.filter((r) => r.codigo === "ASESOR");
      } else if (currentCode === "RRHH") {
        available = available.filter((r) =>
          ["ASESOR", "SUPERVISOR", "BACKOFFICE"].includes(r.codigo),
        );
      }
      setRoles(available);
    } catch {
      toast.error("Error cargando roles");
    }
  }, [currentUser?.rol?.codigo]);

  const fetchWorkspaceOptions = useCallback(async () => {
    try {
      const options = await userService.getWorkspaceOptions();
      setWorkspaceOptions(options);
    } catch {
      // silencioso
    }
  }, []);

  // ── Carga de usuarios con filtros ─────────────

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const effectiveFilters: UserFilters = {
        ...filters,
        id_modalidad_sede:
          currentUser?.rol?.codigo !== "DUENO" && activeWorkspace
            ? (filters.id_modalidad_sede ?? activeWorkspace.id_modalidad_sede)
            : filters.id_modalidad_sede,
      };

      const data = await userService.getAll({
        search: effectiveFilters.search || undefined,
        id_rol: effectiveFilters.id_rol || undefined,
        id_modalidad_sede: effectiveFilters.id_modalidad_sede || undefined,
      });

      setUsers(data);
    } catch {
      toast.error("Error cargando colaboradores");
    } finally {
      setIsLoading(false);
    }
  }, [filters, currentUser?.rol?.codigo, activeWorkspace]);

  useEffect(() => {
    fetchRoles();
    fetchWorkspaceOptions();
  }, [fetchRoles, fetchWorkspaceOptions]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.activo).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [users]);

  // ── CRUD ──────────────────────────────────────

  const createUser = async (
    payload: CreateUserPayload,
    isSupervisor: boolean,
    selectedWorkspaces: number[],
  ): Promise<boolean> => {
    try {
      const newUser = await userService.create(payload);

      if (isSupervisor && newUser.id) {
        const today = new Date().toISOString().split("T")[0];
        for (const wsId of selectedWorkspaces) {
          try {
            await userService.assignSupervisor({
              id_supervisor: newUser.id,
              id_modalidad_sede: wsId,
              fecha_inicio: today,
              activo: true,
            });
          } catch (e) {
            console.error("Error asignando sede:", e);
          }
        }
      }

      toast.success("Colaborador creado exitosamente");
      fetchUsers();
      return true;
    } catch (err: unknown) {
      const detail = (err as any)?.response?.data;
      const message =
        detail?.username?.[0] ??
        detail?.email?.[0] ??
        detail?.error ??
        "Error al crear";
      toast.error(message);
      return false;
    }
  };

  // 👇 LA MAGIA PARA ACTUALIZAR SIN TOCAR EL BACKEND 👇
  const updateUser = async (
    id: number,
    payload: UpdateUserPayload,
    isSupervisor: boolean,
    selectedWorkspaces: number[],
  ): Promise<boolean> => {
    try {
      await userService.update(id, payload);

      if (isSupervisor) {
        const today = new Date().toISOString().split("T")[0];
        // Recorremos las sedes seleccionadas en la UI
        for (const wsId of selectedWorkspaces) {
          try {
            // Intentamos crearlas. Si el backend da error (ej: ya existía la asignación),
            // el catch interno lo atrapa para que el bucle siga avanzando con las demás sedes.
            await userService.assignSupervisor({
              id_supervisor: id,
              id_modalidad_sede: wsId,
              fecha_inicio: today,
              activo: true,
            });
          } catch (e) {
            // Silencioso. Asumimos que la sede ya estaba asignada previamente.
          }
        }
      }

      toast.success("Colaborador actualizado");
      fetchUsers();
      return true;
    } catch {
      toast.error("Error al actualizar el colaborador");
      return false;
    }
  };

  const deactivateUser = async (id: number): Promise<void> => {
    try {
      await userService.deactivate(id);
      toast.success("Colaborador desactivado");
      fetchUsers();
    } catch {
      toast.error("Error al desactivar el colaborador");
    }
  };

  return {
    users,
    roles,
    workspaceOptions,
    stats,
    isLoading,
    filters,
    setFilters,
    createUser,
    updateUser,
    deactivateUser,
    refetch: fetchUsers,
  };
};
