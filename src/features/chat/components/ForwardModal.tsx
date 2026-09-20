/**
 * Modal de reenvío de mensajes.
 * Permite al usuario buscar y seleccionar una sala de destino para reenviar
 * el contenido (texto y/o adjunto) de un mensaje existente.
 * El mensaje reenviado incluye `is_forwarded: true`.
 */
import { useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ChatMessage, ChatRoom } from "../types/chat.types";

interface ForwardModalProps {
  message: ChatMessage;
  rooms: ChatRoom[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onForward: (message: ChatMessage, targetRoomId: number) => Promise<void>;
}

export const ForwardModal = ({
  message,
  rooms,
  open,
  onOpenChange,
  onForward,
}: ForwardModalProps) => {
  const [query, setQuery] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [forwarding, setForwarding] = useState(false);

  const filteredRooms = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rooms.filter((room) =>
      q ? room.display_name.toLowerCase().includes(q) : true,
    );
  }, [rooms, query]);

  const handleForward = async () => {
    if (!selectedRoomId) return;
    setForwarding(true);
    try {
      await onForward(message, selectedRoomId);
      onOpenChange(false);
    } finally {
      setForwarding(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setQuery("");
      setSelectedRoomId(null);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reenviar mensaje</DialogTitle>
          <DialogDescription>
            Selecciona una conversación de destino. El mensaje aparecerá
            marcado como &quot;Reenviado&quot;.
          </DialogDescription>
        </DialogHeader>

        {/* Buscador de salas */}
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar conversación…"
            className="w-full pl-8 pr-3 py-2 text-sm bg-muted/60 border border-border rounded-lg outline-none focus:ring-2 focus:ring-sky-400/40"
          />
        </div>

        {/* Lista de salas */}
        <div className="max-h-60 overflow-y-auto divide-y divide-border rounded-xl border border-border">
          {filteredRooms.length === 0 && (
            <p className="text-sm text-center text-muted-foreground py-8">
              Sin resultados
            </p>
          )}
          {filteredRooms.map((room) => (
            <button
              key={room.id}
              type="button"
              onClick={() => setSelectedRoomId(room.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/60 transition-colors ${
                selectedRoomId === room.id ? "bg-sky-500/10 border-l-2 border-sky-500" : ""
              }`}
            >
              {/* Avatar simple */}
              <div className="size-8 rounded-full bg-sky-500/20 text-sky-700 dark:text-sky-300 flex items-center justify-center shrink-0 text-xs font-bold">
                {room.display_name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{room.display_name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {room.room_type === "GROUP" ? "Grupo" : "Privado"}
                  {" · "}
                  {room.members.length} integrante{room.members.length !== 1 ? "s" : ""}
                </p>
              </div>
              {selectedRoomId === room.id && (
                <div className="ml-auto size-4 rounded-full bg-sky-500 flex items-center justify-center shrink-0">
                  <div className="size-2 rounded-full bg-white" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Acciones */}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            size="sm"
            disabled={!selectedRoomId || forwarding}
            onClick={() => void handleForward()}
          >
            {forwarding && <Loader2 size={14} className="animate-spin" />}
            Reenviar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
