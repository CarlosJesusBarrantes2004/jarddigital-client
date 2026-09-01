import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Info, Loader2, MoreVertical, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ChatMessage, ChatRoom } from "../types/chat.types";
import { avatarTone, formatDaySeparator, initials, isSameDay } from "../lib/chat.utils";
import { MessageBubble } from "./MessageBubble";
import { ChatComposer } from "./ChatComposer";
import type { SendMessagePayload } from "../types/chat.types";

interface ConversationPanelProps {
  room: ChatRoom | null;
  messages: ChatMessage[];
  loading: boolean;
  currentUserId: number;
  canDelete: boolean;
  typingName: string | null;
  hasMore: boolean;
  onLoadMore: () => void;
  onSend: (payload: SendMessagePayload) => Promise<void>;
  onDelete: (message: ChatMessage) => void;
  onTyping: () => void;
  onBack?: () => void;
}

export const ConversationPanel = ({
  room,
  messages,
  loading,
  currentUserId,
  canDelete,
  typingName,
  hasMore,
  onLoadMore,
  onSend,
  onDelete,
  onTyping,
  onBack,
}: ConversationPanelProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, room?.id]);

  if (!room) {
    return (
      <div className="flex-1 hidden md:flex flex-col items-center justify-center bg-[#efeae2] dark:bg-[#0b141a] text-muted-foreground">
        <div className="size-16 rounded-full bg-sky-500/10 text-sky-600 flex items-center justify-center mb-3">
          <Users size={28} />
        </div>
        <p className="text-lg font-medium text-foreground">Chat interno Jard Digital</p>
        <p className="text-sm mt-1">Selecciona una conversación para empezar.</p>
      </div>
    );
  }

  return (
    <section className="flex-1 flex flex-col min-w-0 h-full bg-[#efeae2] dark:bg-[#0b141a]">
      <header className="h-16 px-4 flex items-center justify-between bg-card border-b border-border shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="md:hidden size-9 rounded-full hover:bg-muted flex items-center justify-center"
              aria-label="Volver"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <Avatar className="size-10">
            <AvatarFallback className={cn("text-white text-xs", avatarTone(room.display_name))}>
              {room.room_type === "GROUP" ? <Users size={16} /> : initials(room.display_name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{room.display_name}</p>
            <p className="text-[11px] text-muted-foreground truncate">
              {typingName
                ? `${typingName} está escribiendo…`
                : room.room_type === "GROUP"
                  ? `${room.members.length} integrantes`
                  : "Chat privado"}
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="size-9 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground"
              aria-label="Opciones del chat"
            >
              <MoreVertical size={18} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setInfoOpen(true)}>
              <Info size={14} />
              Info del chat
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5">
        {hasMore && (
          <div className="flex justify-center py-2">
            <button
              type="button"
              onClick={onLoadMore}
              className="text-xs text-sky-700 bg-white/80 dark:bg-secondary px-3 py-1 rounded-full border border-border"
            >
              Cargar mensajes anteriores
            </button>
          </div>
        )}
        {loading && messages.length === 0 && (
          <div className="flex justify-center py-10 text-muted-foreground">
            <Loader2 className="animate-spin" size={20} />
          </div>
        )}
        {messages.map((message, index) => {
          const prev = messages[index - 1];
          const showDay = !prev || !isSameDay(prev.created_at, message.created_at);
          const showSender =
            room.room_type === "GROUP" &&
            (!prev || prev.sender !== message.sender || showDay);
          return (
            <div key={message.id}>
              {showDay && (
                <div className="flex justify-center my-3">
                  <span className="text-[11px] bg-white/80 dark:bg-secondary px-3 py-1 rounded-full text-muted-foreground shadow-sm">
                    {formatDaySeparator(message.created_at)}
                  </span>
                </div>
              )}
              <MessageBubble
                message={message}
                mine={message.sender === currentUserId}
                showSender={showSender}
                canDelete={canDelete}
                onDelete={onDelete}
                onOpenImage={setLightbox}
              />
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <ChatComposer
        disabled={room.is_readonly}
        disabledReason="Esta conversación está en solo lectura: ya no comparten un grupo activo ni una autorización vigente."
        onSend={onSend}
        onTyping={onTyping}
      />

      {lightbox && (
        <button
          type="button"
          className="fixed inset-0 z-[80] bg-black/80 flex items-center justify-center p-6"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox}
            alt="Vista previa"
            className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-2xl"
          />
        </button>
      )}

      {infoOpen && (
        <button
          type="button"
          className="fixed inset-0 z-[70] bg-black/40 flex items-end md:items-center justify-center"
          onClick={() => setInfoOpen(false)}
        >
          <div
            className="bg-card w-full max-w-md rounded-t-2xl md:rounded-2xl p-5 text-left shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="font-semibold mb-3">Integrantes</p>
            <ul className="space-y-2 max-h-72 overflow-y-auto">
              {room.members.map((member) => (
                <li key={member.user} className="flex items-center justify-between text-sm">
                  <span>{member.nombre_completo}</span>
                  <span className="text-[11px] text-muted-foreground">{member.role}</span>
                </li>
              ))}
            </ul>
          </div>
        </button>
      )}
    </section>
  );
};
