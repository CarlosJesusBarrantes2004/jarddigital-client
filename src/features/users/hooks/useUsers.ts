import { useCallback, useEffect, useState } from "react";
import type { Role, User, UserPayload } from "../types";
import { userService } from "../services/userService";
import { toast } from "sonner";

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ search: "", id_rol: 0 });

  const fetchUsers = useCallback(async () => {
    setLoading(true);

    try {
      const data = await userService.getAll({
        search: filters.search,
        id_rol: filters.id_rol > 0 ? filters.id_rol : undefined,
      });

      setUsers(data);
    } catch (error) {
      console.error(error);
      toast.error("Error cargando usuarios");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchRoles = useCallback(async () => {
    try {
      const data = await userService.getRoles();
      setRoles(data);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [fetchUsers, fetchRoles]);

  const createUser = async (payload: UserPayload) => {
    try {
      await userService.create(payload);
      toast.success("Usuario creado");
      fetchUsers();
      return true;
    } catch (error) {
      toast.error("Error creando usuario");
      return false;
    }
  };

  const updateUser = async (id: number, payload: Partial<UserPayload>) => {
    try {
      await userService.update(id, payload);
      toast.success("Usuario actualizado");
      fetchUsers();
      return true;
    } catch (error) {
      toast.error("Error actualizando usuario");
      return false;
    }
  };

  const deleteUser = async (id: number) => {
    try {
      await userService.delete(id);
      toast.success("Usuario desactivado");
    } catch (error) {
      toast.error("Error eliminado");
    }
  };

  return {
    users,
    roles,
    loading,
    filters,
    setFilters,
    createUser,
    updateUser,
    deleteUser,
  };
};
