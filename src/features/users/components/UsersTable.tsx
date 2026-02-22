import { Card } from "@/components/ui/card";
import type { User } from "../types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2 } from "lucide-react";

const roleColors: Record<number, { label: string; class: string }> = {
  1: { label: "Dueño", class: "bg-red-100 text-red-800" },
  2: { label: "Supervisor", class: "bg-blue-100 text-blue-800" },
  3: { label: "RRHH", class: "bg-orange-100 text-orange-800" },
  4: { label: "BackOffice", class: "bg-purple-100 text-purple-800" },
  5: { label: "Asesor", class: "bg-green-100 text-green-800" },
};

interface UsersTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (id: number) => void;
}

export const UsersTable = ({ users, onEdit, onDelete }: UsersTableProps) => {
  return (
    <>
      <Card className="hidden md:block overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-primary/10 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  Sucursales
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {user.nombre_completo.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">
                          {user.nombre_completo}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      className={cn("text-xs", roleColors[user.id_rol].class)}
                    >
                      {roleColors[user.id_rol].label || "Sin Rol"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {user.sucursales?.slice(0, 2).map((s, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {s.nombre_sucursal} - {s.nombre_modalidad}
                        </Badge>
                      ))}
                      {user.sucursales && user.sucursales.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{user.sucursales.length - 2}
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full",
                          user.activo ? "bg-green-500" : "bg-gray-400",
                        )}
                      />
                      <span className="text-sm">
                        {user.activo ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(user)}
                        className="text-blue-600 hover:bg-blue-50"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(user.id)}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="md:hidden space-y-4">
        {users.map((user) => (
          <Card key={user.id} className="p-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {user.nombre_completo.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">
                      {user.nombre_completo}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>
                <Badge className={cn("text-xs", roleColors[user.id_rol].class)}>
                  {roleColors[user.id_rol].label}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-1">
                {user.sucursales?.map((s, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {s.nombre_sucursal} - {s.nombre_modalidad}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full",
                      user.activo ? "bg-green-500" : "bg-gray-400",
                    )}
                  />
                  <span className="text-sm">
                    {user.activo ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="hover:cursor-pointer"
                    onClick={() => onEdit(user)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="hover:cursor-pointer"
                    onClick={() => onDelete(user.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
};
