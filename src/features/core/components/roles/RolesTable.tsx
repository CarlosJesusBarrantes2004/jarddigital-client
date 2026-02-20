import { Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Role } from "@/features/auth/types";

interface RolesTableProps {
  roles: Role[];
  onEdit: (role: Role) => void;
  onDelete: (id: number) => void;
}

export function RolesTable({ roles, onEdit, onDelete }: RolesTableProps) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-primary/10 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">
                Código
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold">
                Descripción
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold">
                Nivel Jerárquico
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
            {roles.map((rol) => (
              <tr key={rol.id} className="hover:bg-muted/50 transition-colors">
                <td className="px-6 py-4">
                  <Badge variant="outline">{rol.codigo}</Badge>
                </td>
                <td className="px-6 py-4">
                  <p className="font-medium text-foreground">{rol.nombre}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-muted-foreground max-w-xs truncate">
                    {/* Hacemos un casting seguro asumiendo que agregaste descripcion al type */}
                    {(rol as any).descripcion || "Sin descripción"}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-sm">Nivel {rol.nivel_jerarquia}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${rol.activo ? "bg-green-500" : "bg-gray-400"}`}
                    />
                    <span className="text-sm">
                      {rol.activo ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(rol)}
                      className="text-blue-600 hover:bg-blue-50"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(rol.id)}
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
  );
}
