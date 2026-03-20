/**
 * features/users/pages/UsersPage.tsx
 *
 * FIX #7 — Colaboradores inactivos ahora aparecen y se pueden reactivar.
 *
 * Estrategia: el backend filtra activo=True por defecto (SoftDeleteModelViewSet).
 * Solución sin tocar el backend: hacemos DOS llamadas paralelas —
 *   /users/empleados/?activo=true  (activos)
 *   /users/empleados/?activo=false (inactivos)
 * y los mostramos en tabs separadas. El botón "Reactivar" llama a
 * userService.reactivate(id) que hace PATCH { activo: true }.
 *
 * NOTA BACKEND MÍNIMA: el UsuarioViewSet necesita aceptar ?activo= como filtro.
 * Ver CAMBIOS_BACKEND_USERS.md para el diff de 1 línea.
 */
import { useState } from "react";
import {
  Plus,
  Search,
  SlidersHorizontal,
  X,
  Users,
  UserCheck,
  UserX,
  RotateCcw,
  Loader2,
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
import { toast } from "sonner";

import { useAuth } from "@/features/auth/context/useAuth";
import { useUsers } from "../hooks/useUsers";
import { UserForm } from "../components/UserForm";
import { UsersTable } from "../components/UsersTable";
import type { CreateUserPayload, UpdateUserPayload, User } from "../types";
import { cn } from "@/lib/utils";

// ─── Tabs ─────────────────────────────────────────────────────────────────────
type Tab = "activos" | "inactivos";

export const UsersPage = () => {
  const { user: currentUser } = useAuth();
  const {
    users, // ← activos (comportamiento original)
    inactiveUsers, // ← inactivos (nuevo — ver hook)
    roles,
    workspaceOptions,
    stats,
    isLoading,
    isLoadingInactive,
    filters,
    setFilters,
    createUser,
    updateUser,
    deactivateUser,
    reactivateUser, // ← nuevo — ver hook
  } = useUsers();

  const isDueno = currentUser?.rol?.codigo === "DUENO";

  const [tab, setTab] = useState<Tab>("activos");
  const [isSheetOpen, setSheetOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  const [reactivatingId, setReactivatingId] = useState<number | null>(null);
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

  // FIX #7: Reactivar colaborador inactivo
  const handleReactivar = async (user: User) => {
    setReactivatingId(user.id);
    try {
      await reactivateUser(user.id);
      toast.success(`${user.nombre_completo} reactivado correctamente`);
    } catch {
      toast.error("No se pudo reactivar el colaborador.");
    } finally {
      setReactivatingId(null);
    }
  };

  const activeFilterCount = [filters.id_rol, filters.id_modalidad_sede].filter(
    Boolean,
  ).length;

  const tabData: Record<
    Tab,
    { list: User[]; loading: boolean; empty: string }
  > = {
    activos: {
      list: users,
      loading: isLoading,
      empty: "No se encontraron colaboradores activos",
    },
    inactivos: {
      list: inactiveUsers,
      loading: isLoadingInactive,
      empty: "No hay colaboradores inactivos",
    },
  };

  const current = tabData[tab];

  return (
    <div className="font-sans min-h-screen p-6 sm:p-8 max-w-[1200px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
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
        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4 hover:border-primary/30 transition-colors shadow-sm">
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

        {/* FIX #7: Stat de activos es clickable y activa el tab */}
        <button
          onClick={() => setTab("activos")}
          className={cn(
            "bg-card border rounded-2xl p-5 flex items-center gap-4 transition-all shadow-sm text-left",
            tab === "activos"
              ? "border-emerald-500/40 bg-emerald-500/5"
              : "border-border hover:border-emerald-500/30",
          )}
        >
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
        </button>

        {/* FIX #7: Stat de inactivos es clickable y activa el tab */}
        <button
          onClick={() => setTab("inactivos")}
          className={cn(
            "bg-card border rounded-2xl p-5 flex items-center gap-4 transition-all shadow-sm text-left",
            tab === "inactivos"
              ? "border-destructive/40 bg-destructive/5"
              : "border-border hover:border-muted-foreground/30",
          )}
        >
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
        </button>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 mb-5 bg-muted/40 p-1 rounded-xl w-fit border border-border">
        {(["activos", "inactivos"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-5 py-2 rounded-lg text-sm font-medium transition-all duration-150 capitalize",
              tab === t
                ? "bg-card text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t === "activos"
              ? `Activos (${stats.active})`
              : `Inactivos (${stats.inactive})`}
          </button>
        ))}
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

          {/* Filtros */}
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

          {/* Solo mostramos "Nuevo colaborador" cuando estamos en la pestaña activos */}
          {tab === "activos" && (
            <button
              type="button"
              className="h-10 px-4 bg-primary text-primary-foreground rounded-xl font-semibold text-[13px] flex items-center gap-2 shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-95 whitespace-nowrap"
              onClick={openCreate}
            >
              <Plus size={15} /> Nuevo colaborador
            </button>
          )}
        </div>

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
                className="h-9 px-3 bg-transparent border border-border rounded-lg text-muted-foreground font-sans text-[13px] flex items-center gap-1.5 hover:text-foreground hover:bg-muted w-fit transition-colors"
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

      {/* ── Tabla según tab ── */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        {tab === "activos" ? (
          <UsersTable
            users={current.list}
            roles={roles}
            isLoading={current.loading}
            onEdit={openEdit}
            onDelete={setUserToDelete}
          />
        ) : (
          /* FIX #7: Tabla de inactivos con botón Reactivar */
          <InactivosTable
            users={current.list}
            roles={roles}
            isLoading={current.loading}
            emptyMessage={current.empty}
            reactivatingId={reactivatingId}
            onReactivar={handleReactivar}
            onEdit={openEdit}
          />
        )}
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
              currentUser={currentUser}
              onSave={handleSave}
              onCancel={() => setSheetOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* ── AlertDialog Desactivar ── */}
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
              El colaborador perderá acceso al sistema. Podrás reactivarlo desde
              la pestaña "Inactivos".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border border-border text-foreground hover:bg-muted">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive/10 border border-destructive/30 text-destructive hover:bg-destructive/20"
            >
              Desactivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// ─── Tabla de inactivos con botón Reactivar ──────────────────────────────────
import type { Role } from "../types";

function getRoleLabel(roles: Role[], idRol: number): string {
  const role = roles.find((r) => r.id === idRol);
  return role?.nombre ?? "Sin rol";
}

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(" ").filter(Boolean);
  const init =
    parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();
  return <>{init}</>;
}

interface InactivosTableProps {
  users: User[];
  roles: Role[];
  isLoading: boolean;
  emptyMessage: string;
  reactivatingId: number | null;
  onReactivar: (user: User) => void;
  onEdit: (user: User) => void;
}

function InactivosTable({
  users,
  roles,
  isLoading,
  emptyMessage,
  reactivatingId,
  onReactivar,
  onEdit,
}: InactivosTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-sm">Cargando inactivos…</span>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground/60">
        <UserCheck size={32} />
        <p className="text-sm font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {users.map((user) => {
        const isReactivating = reactivatingId === user.id;
        return (
          <div
            key={user.id}
            className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors"
          >
            {/* Avatar */}
            <div className="w-9 h-9 rounded-xl bg-muted border border-border flex items-center justify-center text-[11px] font-bold text-muted-foreground shrink-0">
              <Initials name={user.nombre_completo} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-medium text-foreground/70 leading-snug truncate">
                {user.nombre_completo}
              </p>
              <p className="text-[11px] font-mono text-muted-foreground/60 mt-0.5">
                {user.email} · {getRoleLabel(roles, user.id_rol)}
              </p>
            </div>

            {/* Acciones */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Editar (por si necesitan corregir datos antes de reactivar) */}
              <button
                type="button"
                onClick={() => onEdit(user)}
                title="Editar"
                className="h-8 px-3 rounded-lg border border-border text-muted-foreground text-[12px] font-medium hover:bg-muted hover:text-foreground transition-colors"
              >
                Editar
              </button>

              {/* FIX #7: Botón Reactivar */}
              <button
                type="button"
                onClick={() => !isReactivating && onReactivar(user)}
                disabled={isReactivating}
                title="Reactivar colaborador"
                className={cn(
                  "h-8 px-3 rounded-lg border text-[12px] font-semibold flex items-center gap-1.5 transition-all",
                  isReactivating
                    ? "opacity-50 cursor-not-allowed border-border text-muted-foreground"
                    : "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500 hover:text-white hover:border-emerald-500",
                )}
              >
                {isReactivating ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <RotateCcw size={12} />
                )}
                Reactivar
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
