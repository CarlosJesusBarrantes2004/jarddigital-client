import { useCallback, useEffect, useState } from "react";
import type { Role, User, UserPayload } from "../types";
import { userService } from "../services/userService";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/context/useAuth";

export const useUsers = () => {
  const { user: currentUser } = useAuth();

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
      const currentUserRole = currentUser?.rol.codigo;

      let filteredRoles = data.filter((r) => r.codigo !== "DUENO");

      if (currentUserRole === "SUPERVISOR")
        filteredRoles = filteredRoles.filter((r) => r.codigo === "ASESOR");
      else if (currentUserRole === "RRHH")
        filteredRoles = filteredRoles.filter((r) =>
          ["ASESOR", "SUPERVISOR"].includes(r.codigo),
        );

      setRoles(filteredRoles);
    } catch (error) {
      console.error(error);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [fetchUsers, fetchRoles]);

  const createUser = async (
    payload: UserPayload,
    isSupervisor: boolean,
    selectedBranches: number[],
  ) => {
    try {
      const newUser = await userService.create(payload);

      if (isSupervisor && newUser.id) {
        const today = new Date().toISOString().split("T")[0];

        for (const branchId of selectedBranches) {
          await userService.assignSupervisor({
            id_supervisor: newUser.id,
            id_modalidad_sede: branchId,
            fecha_inicio: today,
            activo: true,
          });
        }
      }

      toast.success("Usuario creado exitosamente");
      fetchUsers();
      return true;
    } catch (error) {
      toast.error("Error creando usuario");
      console.error(error);
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
      fetchUsers();
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
