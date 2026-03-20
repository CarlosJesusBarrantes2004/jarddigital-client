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
import { extractApiError } from "@/lib/api-errors";

export const useUsers = () => {
  const { user: currentUser, activeWorkspace } = useAuth();

  // ── Estado ──────────────────────────────────────────────────────────────────
  const [users, setUsers] = useState<User[]>([]); // activos
  const [inactiveUsers, setInactiveUsers] = useState<User[]>([]); // FIX #7: inactivos
  const [roles, setRoles] = useState<Role[]>([]);
  const [workspaceOptions, setWorkspaceOptions] = useState<WorkspaceOption[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingInactive, setIsLoadingInactive] = useState(false); // FIX #7

  const [filters, setFilters] = useState<UserFilters>({
    search: "",
    id_rol: undefined,
    id_modalidad_sede: undefined,
  });

  // ── Catálogos ────────────────────────────────────────────────────────────────
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
      /* silencioso */
    }
  }, []);

  // ── Carga de activos ─────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const effectiveFilters: UserFilters = {
        ...filters,
        activo: true, // FIX #7: explícito para que el backend no filtre mal
        id_modalidad_sede:
          currentUser?.rol?.codigo !== "DUENO" && activeWorkspace
            ? (filters.id_modalidad_sede ?? activeWorkspace.id_modalidad_sede)
            : filters.id_modalidad_sede,
      };
      const data = await userService.getAll({
        search: effectiveFilters.search || undefined,
        id_rol: effectiveFilters.id_rol || undefined,
        id_modalidad_sede: effectiveFilters.id_modalidad_sede || undefined,
        activo: true,
      });
      setUsers(data);
    } catch {
      toast.error("Error cargando colaboradores");
    } finally {
      setIsLoading(false);
    }
  }, [filters, currentUser?.rol?.codigo, activeWorkspace]);

  // ── FIX #7: Carga de inactivos ───────────────────────────────────────────────
  const fetchInactiveUsers = useCallback(async () => {
    setIsLoadingInactive(true);
    try {
      const data = await userService.getAll({
        activo: false,
        // Aplicamos los mismos filtros de texto/rol si existen
        search: filters.search || undefined,
        id_rol: filters.id_rol || undefined,
        id_modalidad_sede:
          currentUser?.rol?.codigo !== "DUENO" && activeWorkspace
            ? (filters.id_modalidad_sede ?? activeWorkspace.id_modalidad_sede)
            : filters.id_modalidad_sede,
      });
      setInactiveUsers(data);
    } catch {
      // No mostramos toast para no saturar — simplemente dejamos la lista vacía
      setInactiveUsers([]);
    } finally {
      setIsLoadingInactive(false);
    }
  }, [filters, currentUser?.rol?.codigo, activeWorkspace]);

  // ── Effects ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchRoles();
    fetchWorkspaceOptions();
  }, [fetchRoles, fetchWorkspaceOptions]);

  useEffect(() => {
    fetchUsers();
    fetchInactiveUsers(); // FIX #7: siempre recargamos ambas listas juntas
  }, [fetchUsers, fetchInactiveUsers]);

  // ── Stats ────────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const active = users.length;
    const inactive = inactiveUsers.length; // FIX #7: conteo real
    return { total: active + inactive, active, inactive };
  }, [users, inactiveUsers]);

  // ── CRUD ──────────────────────────────────────────────────────────────────────
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
      fetchInactiveUsers();
      return true;
    } catch (err) {
      toast.error(extractApiError(err));
      return false;
    }
  };

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
        for (const wsId of selectedWorkspaces) {
          try {
            await userService.assignSupervisor({
              id_supervisor: id,
              id_modalidad_sede: wsId,
              fecha_inicio: today,
              activo: true,
            });
          } catch (e) {
            console.log(e);
          }
        }
      }
      toast.success("Colaborador actualizado");
      fetchUsers();
      fetchInactiveUsers(); // FIX #7
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
      fetchInactiveUsers(); // FIX #7: mueve al inactivo inmediatamente
    } catch {
      toast.error("Error al desactivar el colaborador");
    }
  };

  // FIX #7: Reactivar un colaborador inactivo
  const reactivateUser = async (id: number): Promise<void> => {
    await userService.reactivate(id);
    fetchUsers();
    fetchInactiveUsers();
  };

  return {
    users,
    inactiveUsers, // FIX #7
    roles,
    workspaceOptions,
    stats,
    isLoading,
    isLoadingInactive, // FIX #7
    filters,
    setFilters,
    createUser,
    updateUser,
    deactivateUser,
    reactivateUser, // FIX #7
    refetch: () => {
      fetchUsers();
      fetchInactiveUsers();
    },
  };
};
