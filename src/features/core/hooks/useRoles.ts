import type { Role } from "@/features/auth/types";
import { useCallback, useEffect, useState } from "react";
import type { RolePayload } from "../types";
import { api } from "@/api/axios";

export const useRoles = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<Role[]>("/users/roles/");
      setRoles(data);
    } catch (error) {
      console.error("Error fetching roles:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const createRole = async (payload: RolePayload) => {
    try {
      await api.post("/users/roles/", payload);
      await fetchRoles();
      return true;
    } catch (error) {
      return false;
    }
  };

  const updateRole = async (id: number, payload: RolePayload) => {
    try {
      await api.patch(`/users/roles/${id}/`, payload);
      await fetchRoles();
      return true;
    } catch (error) {
      return false;
    }
  };

  const deleteRole = async (id: number) => {
    try {
      await api.delete(`/users/roles/${id}/`);
      setRoles((prev) => prev.filter((r) => r.id !== id));
      return true;
    } catch (error) {
      return false;
    }
  };

  return { roles, loading, createRole, updateRole, deleteRole };
};
