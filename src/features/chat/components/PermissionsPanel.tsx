import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ChatPermissionFlags } from "../types/chat.types";

interface PermissionsPanelProps {
  open: boolean;
  matrix: ChatPermissionFlags[];
  canEdit: boolean;
  onOpenChange: (open: boolean) => void;
  onToggle: (
    row: ChatPermissionFlags,
    flag: keyof Pick<
      ChatPermissionFlags,
      | "can_create_groups"
      | "can_delete_messages"
      | "can_audit_all_chats"
      | "can_allow_direct_messages"
    >,
    value: boolean,
  ) => void;
}

const COLUMNS = [
  { key: "can_create_groups", label: "Crear grupos" },
  { key: "can_delete_messages", label: "Borrar mensajes" },
  { key: "can_audit_all_chats", label: "Auditoría total" },
  { key: "can_allow_direct_messages", label: "Autorizar 1 a 1" },
] as const;

export const PermissionsPanel = ({
  open,
  matrix,
  canEdit,
  onOpenChange,
  onToggle,
}: PermissionsPanelProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Matriz de permisos de chat</DialogTitle>
        </DialogHeader>
        <div className="overflow-auto max-h-[70vh] rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 sticky top-0">
              <tr>
                <th className="text-left px-3 py-2 font-medium">Colaborador</th>
                <th className="text-left px-3 py-2 font-medium">Rol</th>
                {COLUMNS.map((col) => (
                  <th key={col.key} className="px-3 py-2 font-medium text-center">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row) => (
                <tr key={row.user_id} className="border-t border-border">
                  <td className="px-3 py-2">
                    <p className="font-medium">{row.nombre_completo}</p>
                    <p className="text-[11px] text-muted-foreground">@{row.username}</p>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{row.rol || "—"}</td>
                  {COLUMNS.map((col) => (
                    <td key={col.key} className="px-3 py-2 text-center">
                      <div className="flex justify-center">
                        <Switch
                          checked={row[col.key]}
                          disabled={!canEdit || row.is_dueno_bypass}
                          onCheckedChange={(value) => onToggle(row, col.key, value)}
                        />
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!canEdit && (
          <p className="text-xs text-muted-foreground">
            Solo el dueño puede modificar la matriz. Estás en modo auditoría.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};
