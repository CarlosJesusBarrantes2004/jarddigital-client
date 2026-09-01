import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import type { ChatWsNotification } from "../types/chat.types";
import { previewFromNotification } from "./chat.utils";

export function showIncomingChatToast(
  event: ChatWsNotification,
  onOpen: () => void,
): void {
  const isGroup = event.room_type === "GROUP";
  const roomLabel = isGroup
    ? event.room_name?.trim() || "Grupo"
    : "Chat privado";
  const preview = previewFromNotification(event);

  toast.custom(
    (id) => (
      <button
        type="button"
        onClick={() => {
          onOpen();
          toast.dismiss(id);
        }}
        className="w-[min(100%,356px)] flex items-start gap-3 rounded-xl border border-border bg-popover p-3 text-left shadow-lg hover:bg-muted/40 transition-colors"
      >
        <div className="size-10 rounded-full bg-sky-600 text-white flex items-center justify-center shrink-0 mt-0.5">
          <MessageCircle size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate text-popover-foreground">
            {event.sender_name || "Nuevo mensaje"}
          </p>
          <p className="text-[11px] text-muted-foreground truncate">{roomLabel}</p>
          <p className="text-[13px] text-popover-foreground/90 truncate mt-0.5">
            {preview}
          </p>
        </div>
        <span className="text-[11px] font-semibold text-sky-600 self-center shrink-0">
          Abrir
        </span>
      </button>
    ),
    {
      id: `chat-notify-${event.room_id}`,
      duration: 7000,
    },
  );
}
