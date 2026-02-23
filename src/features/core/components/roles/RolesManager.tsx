import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GlobalLoader } from "@/components/GlobalLoader";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import type { RoleFormData } from "../../schemas/roleSchema";

import { RolesTable } from "./RolesTable";
import { RoleForm } from "./RoleForm";

import type { Role } from "../../types";

export function RolesManager() {
  const { roles, loading, createRole, updateRole, deleteRole } = useRoles();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<number | null>(null);

  const handleOpenSheet = (role: Role | null = null) => {
    setSelectedRole(role);
    setIsSheetOpen(true);
  };

  const handleSave = async (data: RoleFormData) => {
    setIsSubmitting(true);
    let success = false;

    if (selectedRole) success = await updateRole(selectedRole.id, data);
    else success = await createRole(data);

    setIsSubmitting(false);
    if (success) setIsSheetOpen(false);
  };

  const confirmDelete = async () => {
    if (roleToDelete) {
      await deleteRole(roleToDelete);
      setRoleToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Catálogo de Roles
          </h2>
          <p className="text-sm text-slate-500">
            Define los permisos y jerarquías del sistema.
          </p>
        </div>
        <Button
          onClick={() => handleOpenSheet(null)}
          className="w-full sm:w-auto gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nuevo Rol
        </Button>
      </div>

      {loading ? (
        <GlobalLoader
          fullScreen={false}
          message="Cargando roles del sistema..."
        />
      ) : (
        <RolesTable
          roles={roles}
          onEdit={(role) => handleOpenSheet(role)}
          onDelete={setRoleToDelete}
        />
      )}

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md overflow-y-auto border-l shadow-2xl"
        >
          <SheetHeader>
            <SheetTitle className="text-xl">
              {selectedRole ? "Editar Rol" : "Nuevo Rol"}
            </SheetTitle>
            <SheetDescription>
              {selectedRole
                ? "Modifica la estructura o jerarquía de este rol."
                : "Agrega un nuevo rol de acceso para los empleados."}
            </SheetDescription>
          </SheetHeader>
          <RoleForm
            role={selectedRole}
            isSubmitting={isSubmitting}
            onSave={handleSave}
            onCancel={() => setIsSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={!!roleToDelete}
        onOpenChange={() => setRoleToDelete(null)}
      >
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              ¿Eliminar rol del sistema?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              Esta acción no se puede deshacer. Los usuarios asignados a este
              rol perderán todos sus privilegios operativos inmediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0 mt-4">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-white hover:bg-destructive/90 shadow-sm"
            >
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
