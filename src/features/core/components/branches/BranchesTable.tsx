import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Edit2, Trash2 } from "lucide-react";
import type { Branch } from "../../types";

interface BranchesTableProps {
  branches: Branch[];
  onEdit: (branch: Branch) => void;
  onDelete: (id: number) => void;
}

export const BranchesTable = ({
  branches,
  onEdit,
  onDelete,
}: BranchesTableProps) => {
  if (branches.length === 0)
    return (
      <Card className="p-8 text-center text-muted-foreground border-dashed">
        No se encontraron sucursales.
      </Card>
    );

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-primary/10 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold">
                Dirección
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold">
                Modalidades
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold">
                Estado
              </th>
              <th className="px-6 py-3 text-center text-sm font-semibold">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {branches.map((sucursal) => (
              <tr
                key={sucursal.id}
                className="hover:bg-muted/50 transition-colors"
              >
                <td className="px-6 py-3 text-sm font-medium">
                  {sucursal.nombre}
                </td>
                <td className="px-6 py-3 text-sm text-muted-foreground">
                  {sucursal.direccion}
                </td>
                <td className="px-6 py-3 text-sm">
                  <div className="flex flex-wrap gap-1">
                    {sucursal.modalidades?.map((m) => (
                      <Badge key={m.id} variant="secondary" className="text-xs">
                        {m.nombre}
                      </Badge>
                    ))}
                    {(!sucursal.modalidades ||
                      sucursal.modalidades.length === 0) && (
                      <span className="text-xs text-muted-foreground">
                        Sin modalidades
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-3 text-sm">
                  <Badge variant={sucursal.activo ? "default" : "secondary"}>
                    {sucursal.activo ? "Activo" : "Inactivo"}
                  </Badge>
                </td>
                <td className="px-6 py-3">
                  <div className="flex justify-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onEdit(sucursal)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDelete(sucursal.id)}
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
};
