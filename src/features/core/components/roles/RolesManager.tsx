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
      {/* ── Toolbar ── */}
      <div className="bg-card/50 border border-border rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-foreground tracking-tight">
            Catálogo de Roles
          </h2>
          <p className="text-[13px] text-muted-foreground font-light">
            Define los permisos y jerarquías del sistema.
          </p>
        </div>
        <Button
          onClick={() => handleOpenSheet(null)}
          className="w-full sm:w-auto gap-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl h-10 px-5 shadow-[0_4px_16px_rgba(var(--primary),0.2)] hover:-translate-y-[1px] transition-all active:scale-[0.98]"
        >
          <Plus size={16} /> <span className="font-semibold">Nuevo Rol</span>
        </Button>
      </div>

      {/* ── Tabla ── */}
      {loading ? (
        <GlobalLoader
          fullScreen={false}
          message="Cargando roles del sistema..."
        />
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <RolesTable
            roles={roles}
            onEdit={(role) => handleOpenSheet(role)}
            onDelete={setRoleToDelete}
          />
        </div>
      )}

      {/* ── Sheet Form ── */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md overflow-y-auto p-0 bg-background border-l border-border"
        >
          <SheetHeader className="px-6 py-6 border-b border-border bg-card/50">
            <SheetTitle className="font-serif text-xl text-foreground">
              {selectedRole ? "Editar Rol" : "Nuevo Rol"}
            </SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground">
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

      {/* ── Dialog Delete ── */}
      <AlertDialog
        open={!!roleToDelete}
        onOpenChange={() => setRoleToDelete(null)}
      >
        <AlertDialogContent className="bg-background border border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-foreground">
              ¿Eliminar rol del sistema?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-sm">
              Esta acción no se puede deshacer. Los usuarios asignados a este
              rol perderán todos sus privilegios operativos inmediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border border-border text-foreground hover:bg-muted rounded-xl">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive/10 border border-destructive/30 text-destructive hover:bg-destructive/20 hover:text-destructive rounded-xl"
            >
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
