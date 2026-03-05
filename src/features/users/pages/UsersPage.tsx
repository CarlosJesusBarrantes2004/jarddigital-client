import { useState } from "react";
import {
  Plus,
  Search,
  SlidersHorizontal,
  X,
  Users,
  UserCheck,
  UserX,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
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

import { useAuth } from "@/features/auth/context/useAuth";
import { useUsers } from "../hooks/useUsers";
import { UserForm } from "../components/UserForm";
import { UsersTable } from "../components/UsersTable";
import type { CreateUserPayload, UpdateUserPayload, User } from "../types";
import { cn } from "@/lib/utils";

export const UsersPage = () => {
  const { user: currentUser } = useAuth();
  const {
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
  } = useUsers();

  console.log(users);
  console.log(roles);

  const isDueno = currentUser?.rol?.codigo === "DUENO";

  const [isSheetOpen, setSheetOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const openCreate = () => {
    setEditingUser(undefined);
    setSheetOpen(true);
  };
  const openEdit = (user: User) => {
    setEditingUser(user);
    setSheetOpen(true);
  };

  const handleSave = async (
    payload: CreateUserPayload | UpdateUserPayload,
    isSupervisor: boolean,
    wsIds: number[],
  ): Promise<boolean> => {
    let ok: boolean;
    if (editingUser) {
      // 👇 Actualizamos esta línea para pasarle isSupervisor y wsIds
      ok = await updateUser(
        editingUser.id,
        payload as UpdateUserPayload,
        isSupervisor,
        wsIds,
      );
    } else {
      ok = await createUser(payload as CreateUserPayload, isSupervisor, wsIds);
    }
    if (ok) setSheetOpen(false);
    return ok;
  };

  const confirmDelete = async () => {
    if (userToDelete) {
      await deactivateUser(userToDelete);
      setUserToDelete(null);
    }
  };

  const activeFilterCount = [filters.id_rol, filters.id_modalidad_sede].filter(
    Boolean,
  ).length;

  return (
    <div className="font-sans min-h-screen p-8 max-w-[1200px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ── Header ── */}
      <div className="flex items-end justify-between gap-4 mb-8 flex-wrap">
        <div>
          <h1 className="font-serif text-[clamp(1.6rem,3vw,2.25rem)] font-bold text-foreground leading-tight mb-1">
            Colaboradores
          </h1>
          <p className="text-sm text-muted-foreground font-light">
            Gestiona el equipo, roles y accesos a sedes
          </p>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-7">
        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4 transition-colors hover:border-primary/30 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Users size={18} />
          </div>
          <div>
            <span className="block font-serif text-3xl font-bold text-primary leading-none">
              {stats.total}
            </span>
            <span className="block text-[11px] text-muted-foreground uppercase tracking-widest font-mono mt-1">
              Total
            </span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4 transition-colors hover:border-emerald-500/30 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <UserCheck size={18} />
          </div>
          <div>
            <span className="block font-serif text-3xl font-bold text-emerald-500 leading-none">
              {stats.active}
            </span>
            <span className="block text-[11px] text-muted-foreground uppercase tracking-widest font-mono mt-1">
              Activos
            </span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4 transition-colors hover:border-border/80 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-muted text-muted-foreground flex items-center justify-center shrink-0">
            <UserX size={18} />
          </div>
          <div>
            <span className="block font-serif text-3xl font-bold text-muted-foreground leading-none">
              {stats.inactive}
            </span>
            <span className="block text-[11px] text-muted-foreground uppercase tracking-widest font-mono mt-1">
              Inactivos
            </span>
          </div>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="bg-card/50 border border-border rounded-2xl p-4 mb-5 flex flex-col gap-3.5 shadow-sm">
        <div className="flex gap-3 items-center flex-wrap">
          {/* Buscador */}
          <div className="flex-1 min-w-[200px] relative">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Buscar por nombre, usuario o email..."
              className="w-full h-10 bg-background border border-border rounded-xl pl-10 pr-4 font-sans text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/20 placeholder:text-muted-foreground"
              value={filters.search ?? ""}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
            />
          </div>

          {/* Botón Filtros */}
          <button
            type="button"
            className={cn(
              "h-10 px-3.5 bg-background border rounded-xl text-[13px] font-medium flex items-center gap-2 transition-colors relative",
              showFilters
                ? "border-primary/50 text-primary bg-primary/5"
                : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal size={14} /> Filtros
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Nuevo Usuario */}
          <button
            type="button"
            className="h-10 px-4 bg-primary text-primary-foreground border-none rounded-xl font-sans font-semibold text-[13px] flex items-center gap-2 shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-95 whitespace-nowrap"
            onClick={openCreate}
          >
            <Plus size={15} /> Nuevo colaborador
          </button>
        </div>

        {/* Panel Filtros Expandibles */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-border animate-in fade-in slide-in-from-top-2">
            <select
              className="h-9 bg-background border border-border rounded-lg px-3 font-sans text-[13px] text-foreground outline-none focus:border-primary cursor-pointer"
              value={filters.id_rol ?? ""}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  id_rol: e.target.value ? Number(e.target.value) : undefined,
                }))
              }
            >
              <option value="">Todos los roles</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nombre}
                </option>
              ))}
            </select>

            {isDueno && (
              <select
                className="h-9 bg-background border border-border rounded-lg px-3 font-sans text-[13px] text-foreground outline-none focus:border-primary cursor-pointer"
                value={filters.id_modalidad_sede ?? ""}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    id_modalidad_sede: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  }))
                }
              >
                <option value="">Todas las sedes</option>
                {workspaceOptions.map((ws) => (
                  <option key={ws.id} value={ws.id}>
                    {ws.etiqueta}
                  </option>
                ))}
              </select>
            )}

            {activeFilterCount > 0 && (
              <button
                type="button"
                className="h-9 px-3 bg-transparent border border-border rounded-lg text-muted-foreground font-sans text-[13px] flex items-center gap-1.5 transition-colors hover:text-foreground hover:bg-muted w-fit"
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    id_rol: undefined,
                    id_modalidad_sede: undefined,
                  }))
                }
              >
                <X size={12} /> Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Tabla ── */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <UsersTable
          users={users}
          roles={roles}
          isLoading={isLoading}
          onEdit={openEdit}
          onDelete={setUserToDelete}
        />
      </div>

      {/* ── Sheet Modal ── */}
      <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="right"
          className="w-full md:w-[480px] overflow-y-auto p-0 bg-background border-l border-border"
        >
          <SheetHeader className="px-6 py-6 border-b border-border bg-card/50">
            <SheetTitle className="font-serif text-xl text-foreground">
              {editingUser ? "Editar colaborador" : "Nuevo colaborador"}
            </SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground">
              {editingUser
                ? "Actualiza los datos y permisos de acceso."
                : "Completa los datos para crear el nuevo colaborador."}
            </SheetDescription>
          </SheetHeader>
          <div className="px-6 py-6">
            <UserForm
              user={editingUser}
              roles={roles}
              branchOptions={workspaceOptions}
              currentUser={currentUser}
              onSave={handleSave}
              onCancel={() => setSheetOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* ── AlertDialog Eliminar ── */}
      <AlertDialog
        open={!!userToDelete}
        onOpenChange={() => setUserToDelete(null)}
      >
        <AlertDialogContent className="bg-background border border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-foreground">
              ¿Desactivar colaborador?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-sm">
              El colaborador perderá acceso al sistema. Podrás reactivarlo en
              cualquier momento editando su perfil.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border border-border text-foreground hover:bg-muted">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive/10 border border-destructive/30 text-destructive hover:bg-destructive/20 hover:text-destructive"
            >
              Desactivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
