import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Eye,
  Info,
  Loader2,
  MoreVertical,
  Search,
  Trash2,
  Unlock,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { chatApi } from "../services/chat.api";
import type {
  ChatDirectoryUser,
  ChatMessage,
  ChatRoom,
  SendMessagePayload,
} from "../types/chat.types";
import { formatDaySeparator, isSameDay } from "../lib/chat.utils";
import { MessageBubble } from "./MessageBubble";
import { ChatComposer } from "./ChatComposer";
import { ChatSearchBar } from "./ChatSearchBar";
import { GroupInfoDrawer } from "./GroupInfoDrawer";
import { RoomAvatar } from "./RoomAvatar";

interface ConversationPanelProps {
  room: ChatRoom | null;
  messages: ChatMessage[];
  loading: boolean;
  currentUserId: number;
  canDelete: boolean;
  typingName: string | null;
  hasMore: boolean;
  /** Todas las salas del usuario (para el ForwardModal) */
  rooms?: ChatRoom[];
  onLoadMore: () => void;
  onSend: (payload: SendMessagePayload) => Promise<void>;
  onDelete: (message: ChatMessage) => void;
  onTyping: () => void;
  onBack?: () => void;
  onStartPrivateChat?: (userId: number, replyMessage?: ChatMessage) => void;
  onMessageVisible?: (messageId: number) => void;
  users?: ChatDirectoryUser[];
  onRoomUpdated?: (room: ChatRoom) => void;
  canUnlockDirect?: boolean;
  unlocking?: boolean;
  onUnlockDirect?: () => void;
  isAuditRoom?: boolean;
  canDeleteRoom?: boolean;
  onDeleteRoom?: () => void;
  pendingReply?: { roomId: number; message: ChatMessage } | null;
  onClearPendingReply?: () => void;
}

export const ConversationPanel = ({
  room,
  messages,
  loading,
  currentUserId,
  canDelete,
  typingName,
  hasMore,
  rooms = [],
  onLoadMore,
  onSend,
  onDelete,
  onTyping,
  onBack,
  onStartPrivateChat,
  onMessageVisible,
  users = [],
  onRoomUpdated,
  canUnlockDirect,
  unlocking,
  onUnlockDirect,
  isAuditRoom,
  canDeleteRoom,
  onDeleteRoom,
  pendingReply,
  onClearPendingReply,
}: ConversationPanelProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [consumedReplyId, setConsumedReplyId] = useState<number | null>(null);

  // ── Búsqueda interna ────────────────────────────────────────────────────
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, room?.id]);

  useEffect(() => {
    setInfoOpen(false);
    setShowSearch(false);
    setSearchQuery("");
    setCurrentMatchIndex(0);
  }, [room?.id]);

  // ── Mensajes filtrados por búsqueda ─────────────────────────────────────
  const matchingIds = useMemo(() => {
    if (!searchQuery) return [];
    const q = searchQuery.toLowerCase();
    return messages
      .filter((m) => !m.is_deleted && m.content?.toLowerCase().includes(q))
      .map((m) => m.id);
  }, [messages, searchQuery]);

  const handleSearchNavigate = useCallback(
    (direction: "prev" | "next") => {
      if (matchingIds.length === 0) return;
      setCurrentMatchIndex((prev) => {
        const next =
          direction === "next"
            ? (prev + 1) % matchingIds.length
            : (prev - 1 + matchingIds.length) % matchingIds.length;
        // Scroll al match correspondiente
        const el = document.getElementById(`msg-${matchingIds[next]}`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        return next;
      });
    },
    [matchingIds],
  );

  const handleCloseSearch = () => {
    setShowSearch(false);
    setSearchQuery("");
    setCurrentMatchIndex(0);
  };

  // ── Manejo de responder mensajes ────────────────────────────────────────
  useEffect(() => {
    if (pendingReply && pendingReply.message.id !== consumedReplyId && room && pendingReply.roomId === room.id) {
      setReplyTo(pendingReply.message);
      setConsumedReplyId(pendingReply.message.id);
      window.dispatchEvent(new Event("focus-chat-composer"));
    }
  }, [pendingReply, consumedReplyId, room]);

  const handleReply = useCallback((msg: ChatMessage) => {
    setReplyTo(msg);
    window.dispatchEvent(new Event("focus-chat-composer"));
  }, []);

  const scrollToMessage = useCallback((messageId: number) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("bg-sky-50", "dark:bg-sky-900/20");
      setTimeout(() => {
        el.classList.remove("bg-sky-50", "dark:bg-sky-900/20");
      }, 2000);
    }
  }, []);

  // ── Reenvío de mensajes ─────────────────────────────────────────────────
  const handleForward = useCallback(
    async (message: ChatMessage, targetRoomId: number) => {
      try {
        await chatApi.sendMessage(targetRoomId, {
          content: message.content ?? "",
          message_type: message.message_type,
          file_url: message.file_url ?? undefined,
          file_name: message.file_name ?? undefined,
          caption: message.caption ?? undefined,
          is_forwarded: true,
        });
        toast.success("Mensaje reenviado.");
      } catch {
        toast.error("No se pudo reenviar el mensaje.");
        throw new Error("forward failed");
      }
    },
    [],
  );

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

  const isGroup = room.room_type === "GROUP";
  const canStartPrivate = isGroup && Boolean(onStartPrivateChat);
  const isMember = room.members.some((m) => m.user === currentUserId);
  const isAuditDirect = room.room_type === "DIRECT" && !isMember;
  const activeMembers = room.members.filter((m) => m.is_active);

  // For audit DIRECT chats, pick the first member as "right side" perspective
  const auditPerspectiveId = isAuditDirect
    ? room.members[0]?.user ?? null
    : null;

  // Header: show both names for audit DIRECT chats
  const headerName = isAuditDirect
    ? room.members.map((m) => m.nombre_completo).join(" · ")
    : room.display_name;

  const roomIdentity = (
    <>
      <RoomAvatar room={room} className="size-10" />
      <div className="min-w-0">
        <p className="text-sm font-semibold truncate">{headerName}</p>
        <p className="text-[11px] text-muted-foreground truncate">
          {typingName
            ? `${typingName} está escribiendo…`
            : isGroup
              ? `${room.members.length} integrantes`
              : isAuditDirect
                ? "Chat privado — Auditoría"
                : "Chat privado"}
        </p>
      </div>
    </>
  );

  return (
    <section className="flex-1 flex flex-col min-w-0 h-full bg-[#efeae2] dark:bg-[#0b141a]">
      {/* Header */}
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
          {isGroup ? (
            <button
              type="button"
              className="flex items-center gap-3 min-w-0 text-left rounded-lg hover:bg-muted/60 -ml-1 px-1 py-1"
              onClick={() => setInfoOpen(true)}
            >
              {roomIdentity}
            </button>
          ) : (
            <div className="flex items-center gap-3 min-w-0">{roomIdentity}</div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Botón lupa — abre/cierra búsqueda */}
          <button
            type="button"
            onClick={() => setShowSearch((v) => !v)}
            className={`size-9 rounded-full flex items-center justify-center transition-colors ${
              showSearch
                ? "bg-sky-500/15 text-sky-600"
                : "hover:bg-muted text-muted-foreground"
            }`}
            aria-label={showSearch ? "Cerrar búsqueda" : "Buscar en conversación"}
            title="Buscar en conversación"
          >
            <Search size={18} />
          </button>

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
              {canDeleteRoom && onDeleteRoom && (
                <DropdownMenuItem
                  onClick={onDeleteRoom}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 size={14} />
                  Eliminar conversación
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Barra de búsqueda (se desliza bajo el header) */}
      {showSearch && (
        <ChatSearchBar
          matchCount={matchingIds.length}
          currentMatch={matchingIds.length > 0 ? currentMatchIndex + 1 : 0}
          onSearch={(q) => {
            setSearchQuery(q);
            setCurrentMatchIndex(0);
          }}
          onNavigate={handleSearchNavigate}
          onClose={handleCloseSearch}
        />
      )}

      {/* Mensajes */}
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
            (isAuditRoom && room.room_type === "DIRECT") ||
            (isGroup && (!prev || prev.sender !== message.sender || showDay));

          const matchIdx = matchingIds.indexOf(message.id);
          const isCurrentMatch = matchIdx !== -1 && matchIdx === currentMatchIndex;

          return (
            <div key={message.id} data-message-id={message.id}>
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
                highlight={searchQuery || undefined}
                isCurrentMatch={isCurrentMatch}
                rooms={rooms}
                onDelete={onDelete}
                onOpenImage={setLightbox}
                onStartPrivateChat={canStartPrivate ? onStartPrivateChat : undefined}
                onVisible={onMessageVisible}
                onForward={handleForward}
                auditPerspectiveId={auditPerspectiveId}
                isReadOnly={Boolean(isAuditRoom || room.is_readonly)}
                onReply={handleReply}
                onScrollToMessage={scrollToMessage}
              />
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Footer: composer o modo solo-lectura */}
      {isAuditRoom ? (
        <div className="px-4 py-3 bg-amber-500/10 border-t border-amber-500/30 text-center text-[13px] text-amber-700 dark:text-amber-400 flex items-center justify-center gap-2">
          <Eye size={14} />
          Modo solo lectura — estás auditando esta conversación.
        </div>
      ) : room.is_readonly ? (
        <div className="px-4 py-3 bg-muted/40 border-t border-border text-center space-y-2">
          <p className="text-[13px] text-muted-foreground">
            Esta conversación está en solo lectura: ya no comparten un grupo
            activo ni una autorización vigente.
          </p>
          {canUnlockDirect && room.room_type === "DIRECT" && onUnlockDirect && (
            <Button size="sm" onClick={onUnlockDirect} disabled={unlocking}>
              {unlocking ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Unlock size={14} />
              )}
              Habilitar chat entre estos usuarios
            </Button>
          )}
        </div>
      ) : (
        <ChatComposer
          onSend={onSend}
          onTyping={onTyping}
          members={activeMembers}
          replyTo={replyTo}
          onCancelReply={() => {
            setReplyTo(null);
            onClearPendingReply?.();
          }}
        />
      )}

      {/* Lightbox de imagen */}
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

      <GroupInfoDrawer
        open={infoOpen}
        room={room}
        currentUserId={currentUserId}
        users={users}
        onOpenChange={setInfoOpen}
        onRoomUpdated={(updated) => {
          onRoomUpdated?.(updated);
        }}
        onStartPrivateChat={canStartPrivate ? onStartPrivateChat : undefined}
      />
    </section>
  );
};
