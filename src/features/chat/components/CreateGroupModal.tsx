import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ChatDirectoryUser } from "../types/chat.types";

interface CreateGroupModalProps {
  open: boolean;
  users: ChatDirectoryUser[];
  currentUserId: number;
  submitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string, memberIds: number[]) => Promise<void>;
}

export const CreateGroupModal = ({
  open,
  users,
  currentUserId,
  submitting,
  onOpenChange,
  onSubmit,
}: CreateGroupModalProps) => {
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<number[]>([]);

  const filtered = useMemo(
    () =>
      users.filter(
        (user) =>
          user.id !== currentUserId &&
          user.nombre_completo.toLowerCase().includes(query.toLowerCase()),
      ),
    [users, currentUserId, query],
  );

  const toggle = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSubmit = async () => {
    if (!name.trim() || selected.length === 0) return;
    await onSubmit(name.trim(), selected);
    setName("");
    setSelected([]);
    setQuery("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo grupo</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nombre del grupo"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar colaboradores"
          />
          <div className="max-h-64 overflow-y-auto border border-border rounded-xl divide-y divide-border">
            {filtered.map((user) => (
              <label
                key={user.id}
                className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted/50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(user.id)}
                  onChange={() => toggle(user.id)}
                  className="accent-sky-500"
                />
                <span className="flex-1 truncate">{user.nombre_completo}</span>
                <span className="text-[11px] text-muted-foreground">
                  {user.rol?.nombre}
                </span>
              </label>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => void handleSubmit()}
            disabled={submitting || !name.trim() || selected.length === 0}
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            Crear grupo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
