import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { extractApiError } from "@/lib/api-errors";

import { coreService } from "../services/coreService";

import type { Role, RolePayload } from "../types";

export const useRoles = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await coreService.getRoles();
      setRoles(data);
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast.error("No se pudieron cargar los roles del sistema.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const createRole = async (payload: RolePayload) => {
    try {
      await coreService.createRole(payload);
      await fetchRoles();
      toast.success("Rol creado exitosamente.");
      return true;
    } catch (error) {
      console.error(error);
      toast.error(extractApiError(error));
      return false;
    }
  };

  const updateRole = async (id: number, payload: RolePayload) => {
    try {
      await coreService.updateRole(id, payload);
      await fetchRoles();
      toast.success("Rol actualizado exitosamente.");
      return true;
    } catch (error) {
      console.error(error);
      toast.error(extractApiError(error));
      return false;
    }
  };

  const deleteRole = async (id: number) => {
    try {
      await coreService.deleteRole(id);
      setRoles((prev) => prev.filter((r) => r.id !== id));
      toast.success("Rol eliminado exitosamente.");
      return true;
    } catch (error) {
      console.error(error);
      toast.error(extractApiError(error));
      return false;
    }
  };

  return { roles, loading, createRole, updateRole, deleteRole };
};
