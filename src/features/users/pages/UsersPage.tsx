import { Card } from "@/components/ui/card";
import { UsersManager } from "../components/UsersManager";
import { useUsers } from "../hooks/useUsers";

export const UsersPage = () => {
  const {
    users,
    roles,
    loading,
    filters,
    setFilters,
    createUser,
    updateUser,
    deleteUser,
  } = useUsers();

  const totalCollaborators = users.length;
  const assets = users.filter((u) => u.activo).length;
  const inactive = totalCollaborators - assets;

  return (
    <div className="min-h-screen bg-background animate-in fade-in duration-500">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Colaboradores</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona los colaboradores y su acceso a sucursales y modalidades
          </p>
        </div>

        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-muted-foreground text-sm">
                Total de Colaboradores
              </p>
              <p className="text-3xl font-bold text-primary mt-2">
                {totalCollaborators}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Activos</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{assets}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Inactivos</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">
                {inactive}
              </p>
            </div>
          </div>
        </Card>

        <UsersManager
          users={users}
          roles={roles}
          loading={loading}
          filters={filters}
          onFilterChange={setFilters}
          onCreateUser={createUser}
          onUpdateUser={updateUser}
          onDeleteUser={deleteUser}
        ></UsersManager>
      </div>
    </div>
  );
};
