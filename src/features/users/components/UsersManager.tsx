import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { UserForm } from "./UserForm";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useState } from "react";
import type { Role, User, UserPayload } from "../types";
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
import { UsersTable } from "./UsersTable";
import { GlobalLoader } from "@/components/GlobalLoader";

interface UsersManagerProps {
  users: User[];
  roles: Role[];
  loading: boolean;
  filters: any;
  onFilterChange: (filters: any) => void;
  onCreateUser: (
    payload: UserPayload,
    isSup: boolean,
    branches: number[],
  ) => Promise<boolean>;
  onUpdateUser: (id: number, payload: Partial<UserPayload>) => Promise<boolean>;
  onDeleteUser: (id: number) => Promise<void>;
}

export const UsersManager = ({
  users,
  roles,
  loading,
  filters,
  onFilterChange,
  onCreateUser,
  onUpdateUser,
  onDeleteUser,
}: UsersManagerProps) => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);

  const handleNewUser = () => {
    setSelectedUser(undefined);
    setIsSheetOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsSheetOpen(true);
  };

  const handleDeleteRequest = (id: number) => setUserToDelete(id);

  const confirmDelete = async () => {
    if (userToDelete) {
      await onDeleteUser(userToDelete);
      setUserToDelete(null);
    }
  };

  const handleSave = async (
    data: UserPayload,
    isSupervisor: boolean,
    branches: number[],
  ) => {
    let success = false;

    if (selectedUser) success = await onUpdateUser(selectedUser.id, data);
    else success = await onCreateUser(data, isSupervisor, branches);

    if (success) setIsSheetOpen(false);
  };

  return (
    <div className="space-y-6">
      <Card className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, usuario o email..."
              value={filters.search}
              onChange={(e) =>
                onFilterChange((prev) => ({ ...prev, search: e.target.value }))
              }
              className="pl-10"
            />
          </div>
          <select
            value={filters.id_rol || ""}
            onChange={(e) =>
              onFilterChange((prev) => ({
                ...prev,
                id_rol: Number(e.target.value) || 0,
              }))
            }
            className="px-4 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Todos los roles</option>
            {roles.map((rol) => (
              <option key={rol.id} value={rol.id}>
                {rol.nombre}
              </option>
            ))}
          </select>
          <Button
            onClick={handleNewUser}
            className="bg-primary hover:bg-primary/90 hover:cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Usuario
          </Button>
        </div>
      </Card>

      {loading ? (
        <GlobalLoader message="Cargando colaboradores..."></GlobalLoader>
      ) : (
        <UsersTable
          users={users}
          onEdit={handleEdit}
          onDelete={handleDeleteRequest}
        />
      )}

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent
          side="right"
          className="w-full md:w-[500px] overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle>
              {selectedUser ? "Editar Usuario" : "Nuevo Usuario"}
            </SheetTitle>
            <SheetDescription>
              {selectedUser
                ? "Actualiza los datos del usuario y sus permisos de acceso."
                : "Crea un nuevo usuario en el sistema y asígnale una sede."}
            </SheetDescription>
          </SheetHeader>
          <div className="m-6">
            <UserForm
              user={selectedUser || undefined}
              roles={roles}
              onSave={handleSave}
              onCancel={() => setIsSheetOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={!!userToDelete}
        onOpenChange={() => setUserToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desactivar colaborador?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción restringirá el acceso del usuario al sistema. Podrás
              volver a activarlo más adelante editando su perfil.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Desactivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
