import { Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Modality } from "../../types";

interface ModalitiesTableProps {
  modalities: Modality[];
  onEdit: (modality: Modality) => void;
  onDelete: (id: number) => void;
}

export function ModalitiesTable({
  modalities,
  onEdit,
  onDelete,
}: ModalitiesTableProps) {
  if (modalities.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground border-dashed">
        No se encontraron modalidades operativas.
      </Card>
    );
  }

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
                Estado
              </th>
              <th className="px-6 py-3 text-center text-sm font-semibold">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {modalities.map((modalidad) => (
              <tr
                key={modalidad.id}
                className="hover:bg-muted/50 transition-colors"
              >
                <td className="px-6 py-3 text-sm font-medium">
                  {modalidad.nombre}
                </td>
                <td className="px-6 py-3 text-sm">
                  <Badge variant={modalidad.activo ? "default" : "secondary"}>
                    {modalidad.activo ? "Activo" : "Inactivo"}
                  </Badge>
                </td>
                <td className="px-6 py-3">
                  <div className="flex justify-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onEdit(modalidad)}
                      className="text-blue-600 hover:bg-blue-50"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDelete(modalidad.id)}
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
