import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRoles } from "../../hooks/useRoles";
import { RolesTable } from "./RolesTable";
import { RoleForm } from "./RoleForm";
import type { Role } from "@/features/auth/types";
import type { RolePayload } from "../../types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function RolesManager() {
  const { roles, loading, createRole, updateRole, deleteRole } = useRoles();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<number | null>(null);

  const handleNew = () => {
    setSelectedRole(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (role: Role) => {
    setSelectedRole(role);
    setIsDialogOpen(true);
  };

  const handleSave = async (data: RolePayload) => {
    let success = false;
    if (selectedRole) success = await updateRole(selectedRole.id, data);
    else success = await createRole(data);

    if (success) setIsDialogOpen(false);
  };

  const confirmDelete = async () => {
    if (roleToDelete) {
      await deleteRole(roleToDelete);
      setRoleToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header V0 exacto */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Gestión de Roles
          </h2>
          <p className="text-muted-foreground mt-1">
            Define los roles y niveles jerárquicos del sistema
          </p>
        </div>
        <Button onClick={handleNew} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Rol
        </Button>
      </div>

      {loading ? (
        <div className="p-10 flex justify-center items-center h-48 border rounded-xl bg-card">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <RolesTable
          roles={roles}
          onEdit={handleEdit}
          onDelete={(id) => setRoleToDelete(id)}
        />
      )}

      {/* Dialogo para el Formulario */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {selectedRole ? "Editar Rol" : "Nuevo Rol"}
            </DialogTitle>
            <DialogDescription>
              {selectedRole
                ? "Actualiza los datos del rol"
                : "Crea un nuevo rol en el sistema"}
            </DialogDescription>
          </DialogHeader>
          <RoleForm
            role={selectedRole}
            onSave={handleSave}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={roleToDelete !== null}
        onOpenChange={() => setRoleToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Está seguro de eliminar este rol?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Los usuarios asignados a este
              rol perderán sus accesos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
