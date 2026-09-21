import { useCallback, useEffect, useRef, useState, type MouseEvent, type TouchEvent as ReactTouchEvent } from "react";
import {
  Check,
  CheckCheck,
  CornerUpRight,
  MoreVertical,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ChatDeliveryStatus, ChatMessage, ChatMessageReplySnippet } from "../types/chat.types";
import {
  avatarTone,
  formatMessageClock,
  initials,
  resolveDeliveryStatus,
} from "../lib/chat.utils";
import { AudioMessage } from "./AudioMessage";
import { DocumentCard } from "./DocumentCard";
import { ForwardModal } from "./ForwardModal";
import { PrivateChatMenuContent } from "./MemberPrivateChatMenu";

interface MessageBubbleProps {
  message: ChatMessage;
  mine: boolean;
  showSender: boolean;
  canDelete: boolean;
  highlight?: string;
  matchIndex?: number; // índice de este mensaje entre los matches para scroll
  isCurrentMatch?: boolean; // true si este es el match actualmente navegado
  rooms?: import("../types/chat.types").ChatRoom[];
  onDelete: (message: ChatMessage) => void;
  onOpenImage: (url: string) => void;
  onStartPrivateChat?: (userId: number, replyMessage?: ChatMessage) => void;
  onVisible?: (messageId: number) => void;
  onForward?: (message: ChatMessage, targetRoomId: number) => Promise<void>;
}

// Minimum swipe distance (px) to trigger reply
const SWIPE_REPLY_THRESHOLD = 60;

export const MessageBubble = ({
  message,
  mine,
  showSender,
  canDelete,
  highlight,
  isCurrentMatch,
  rooms = [],
  onDelete,
  onOpenImage,
  onStartPrivateChat,
  onVisible,
  onForward,
}: MessageBubbleProps) => {
  const [privateMenuOpen, setPrivateMenuOpen] = useState(false);
  const [forwardOpen, setForwardOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const reportedRef = useRef(false);
  const senderName = message.sender_nombre || "Usuario";

  // In audit mode, align messages based on perspective user
  const effectiveMine = auditPerspectiveId != null
    ? message.sender === auditPerspectiveId
    : mine;

  const canPrivate = Boolean(
    onStartPrivateChat && !mine && message.sender,
  );

  // --- Swipe-to-reply state ---
  const swipeRef = useRef({
    startX: 0,
    startY: 0,
    swiping: false,
    triggered: false,
  });
  const [swipeOffset, setSwipeOffset] = useState(0);

  const canReply = Boolean(onReply && !message.is_deleted && !isReadOnly);

  const handleTouchStart = useCallback((e: ReactTouchEvent) => {
    if (!canReply) return;
    const touch = e.touches[0];
    swipeRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      swiping: false,
      triggered: false,
    };
  }, [canReply]);

  const handleTouchMove = useCallback((e: ReactTouchEvent) => {
    if (!canReply) return;
    const touch = e.touches[0];
    const dx = touch.clientX - swipeRef.current.startX;
    const dy = touch.clientY - swipeRef.current.startY;

    // Only trigger horizontal swipe if horizontal movement exceeds vertical
    if (!swipeRef.current.swiping && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
      swipeRef.current.swiping = true;
    }

    if (!swipeRef.current.swiping) return;

    // Only allow right swipe (positive dx), capped at threshold + some extra
    const offset = Math.max(0, Math.min(dx, SWIPE_REPLY_THRESHOLD + 20));
    setSwipeOffset(offset);

    if (offset >= SWIPE_REPLY_THRESHOLD && !swipeRef.current.triggered) {
      swipeRef.current.triggered = true;
      // Haptic feedback if available
      if (navigator.vibrate) navigator.vibrate(30);
    }
  }, [canReply]);

  const handleTouchEnd = useCallback(() => {
    if (swipeRef.current.triggered && onReply) {
      onReply(message);
    }
    setSwipeOffset(0);
    swipeRef.current = { startX: 0, startY: 0, swiping: false, triggered: false };
  }, [message, onReply]);

  useEffect(() => {
    reportedRef.current = false;
  }, [message.id]);

  useEffect(() => {
    if (mine || !onVisible || message.is_deleted || !message.sender) return;
    const el = rootRef.current;
    if (!el) return;

    const tryReport = () => {
      if (reportedRef.current || document.hidden) return;
      const rect = el.getBoundingClientRect();
      if (rect.height <= 0) return;
      const visiblePx =
        Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
      if (visiblePx / rect.height < 0.45) return;
      reportedRef.current = true;
      onVisible(message.id);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) tryReport();
      },
      { threshold: 0.45 },
    );
    observer.observe(el);
    document.addEventListener("visibilitychange", tryReport);
    tryReport();
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", tryReport);
    };
  }, [mine, onVisible, message.id, message.is_deleted, message.sender]);

  const openPrivateMenu = () => {
    if (canPrivate) setPrivateMenuOpen(true);
  };

  const handleBubbleClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!canPrivate) return;
    const target = event.target as HTMLElement;
    if (target.closest("[data-no-private-menu]")) return;
    openPrivateMenu();
  };

  return (
    <div
      ref={rootRef}
      id={`msg-${message.id}`}
      className={cn("flex w-full gap-2", mine ? "justify-end" : "justify-start")}
    >
      {/* Swipe-to-reply indicator */}
      {swipeOffset > 0 && (
        <div
          className={cn(
            "absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full size-8 transition-opacity",
            swipeOffset >= SWIPE_REPLY_THRESHOLD
              ? "bg-sky-500 text-white opacity-100"
              : "bg-muted text-muted-foreground opacity-70",
          )}
          style={{ transform: `translate(${Math.max(0, swipeOffset - 36)}px, -50%)` }}
        >
          <CornerUpLeft size={16} />
        </div>
      )}

      <div
        className={cn(
          "flex w-full gap-2 transition-transform",
          effectiveMine ? "justify-end" : "justify-start"
        )}
        style={{
          transform: swipeOffset > 0 ? `translateX(${swipeOffset}px)` : undefined,
          transition: swipeOffset === 0 ? "transform 200ms ease-out" : "none",
        }}
      >
        {canPrivate && (
          <DropdownMenu open={privateMenuOpen} onOpenChange={setPrivateMenuOpen}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="size-8 shrink-0 self-end rounded-full outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                aria-label={`Chatear con ${senderName}`}
              >
                <Avatar className="size-8">
                  <AvatarFallback
                    className={cn("text-white text-[10px]", avatarTone(senderName))}
                  >
                    {initials(senderName)}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <PrivateChatMenuContent
              memberName={senderName}
              onChat={() => onStartPrivateChat?.(message.sender!)}
              onReplyPrivately={() => onStartPrivateChat?.(message.sender!, message)}
            />
          </DropdownMenu>
        )}

        <div
          className={cn(
            "relative max-w-[78%] rounded-lg px-2.5 py-1.5 shadow-sm",
            effectiveMine
              ? "bg-[#d9fdd3] dark:bg-sky-900/55 rounded-br-none"
              : "bg-white dark:bg-secondary rounded-bl-none",
            canPrivate && "cursor-pointer",
          )}
          onClick={handleBubbleClick}
        >
          {showSender && (!effectiveMine || auditPerspectiveId != null) && (
            <button
              type="button"
              className={cn(
                "text-[11px] font-semibold text-sky-700 dark:text-sky-300 mb-0.5",
                effectiveMine ? "text-right block w-full" : "text-left",
                canPrivate && "hover:underline",
              )}
              onClick={(event) => {
                event.stopPropagation();
                openPrivateMenu();
              }}
            >
              {senderName}
            </button>
          )}

          {/* Reply snippet */}
          {message.reply_to && (
            <ReplySnippet
              snippet={message.reply_to}
              onScrollTo={onScrollToMessage}
              mine={effectiveMine}
            />
          )}

          {message.is_deleted ? (
            <p className="text-[13px] italic text-muted-foreground">
              Este mensaje fue eliminado
            </p>
          ) : (
            <MessageBody
              message={message}
              mine={effectiveMine}
              onOpenImage={onOpenImage}
            />
          )}

          <div className="flex items-center justify-end gap-1 mt-0.5">
            <span className="text-[10px] text-muted-foreground">
              {formatMessageClock(message.created_at)}
            </span>
            {effectiveMine && !message.is_deleted && (
              <DeliveryTicks status={resolveDeliveryStatus(message)} />
            )}
            onClick={(event) => {
              event.stopPropagation();
              openPrivateMenu();
            }}
          >
            {senderName}
          </button>
        )}

        {/* Etiqueta de reenviado */}
        {message.is_forwarded && (
          <p className="text-[10px] text-muted-foreground flex items-center gap-1 mb-0.5">
            <CornerUpRight size={10} />
            Reenviado
          </p>
        )}

        {message.is_deleted ? (
          <p className="text-[13px] italic text-muted-foreground">
            Este mensaje fue eliminado
          </p>
        ) : (
          <MessageBody
            message={message}
            mine={mine}
            highlight={highlight}
            onOpenImage={onOpenImage}
          />
        )}

        <div className="flex items-center justify-end gap-1 mt-0.5">
          <span className="text-[10px] text-muted-foreground">
            {formatMessageClock(message.created_at)}
          </span>
          {mine && !message.is_deleted && (
            <DeliveryTicks status={resolveDeliveryStatus(message)} />
          )}
          {(canDelete || onForward) && !message.is_deleted && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  data-no-private-menu
                  className="text-muted-foreground hover:text-foreground p-0.5 rounded"
                  aria-label="Opciones del mensaje"
                  onClick={(event) => event.stopPropagation()}
                  onPointerDown={(event) => event.stopPropagation()}
                >
                  <MoreVertical size={12} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={mine ? "end" : "start"}>
                {onForward && (
                  <DropdownMenuItem
                    onClick={() => setForwardOpen(true)}
                  >
                    <CornerUpRight size={14} />
                    Reenviar
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDelete(message)}
                  >
                    <Trash2 size={14} />
                    Eliminar mensaje
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Modal de reenvío */}
      {forwardOpen && onForward && (
        <ForwardModal
          message={message}
          rooms={rooms}
          open={forwardOpen}
          onOpenChange={setForwardOpen}
          onForward={onForward}
        />
      )}
    </div>
  );
};

/** Inline preview of the message being replied to */
const ReplySnippet = ({
  snippet,
  onScrollTo,
  mine,
}: {
  snippet: ChatMessageReplySnippet;
  onScrollTo?: (messageId: number) => void;
  mine: boolean;
}) => {
  const replyName = snippet.sender_nombre || "Usuario";

  const previewText = snippet.is_deleted
    ? "Este mensaje fue eliminado"
    : snippet.message_type === "IMAGE"
      ? "📷 Imagen"
      : snippet.message_type === "AUDIO"
        ? "🎤 Audio"
        : snippet.message_type === "PDF"
          ? "📄 PDF"
          : snippet.message_type === "DOCUMENT"
            ? "📎 Documento"
            : snippet.content || "";

  const previewIcon = !snippet.is_deleted && snippet.message_type === "IMAGE" ? (
    <ImageIcon size={12} className="shrink-0 text-muted-foreground" />
  ) : !snippet.is_deleted && snippet.message_type === "AUDIO" ? (
    <Mic size={12} className="shrink-0 text-muted-foreground" />
  ) : !snippet.is_deleted && (snippet.message_type === "PDF" || snippet.message_type === "DOCUMENT") ? (
    <FileText size={12} className="shrink-0 text-muted-foreground" />
  ) : null;

  return (
    <button
      type="button"
      data-no-private-menu
      className={cn(
        "block w-full text-left rounded-md px-2.5 py-1.5 mb-1 border-l-[3px] transition-colors",
        mine
          ? "bg-[#c5f0bc] dark:bg-sky-800/40 border-l-emerald-600 dark:border-l-sky-400"
          : "bg-gray-100 dark:bg-muted/60 border-l-sky-500 dark:border-l-sky-400",
      )}
      onClick={(e) => {
        e.stopPropagation();
        onScrollTo?.(snippet.id);
      }}
    >
      <p className="text-[11px] font-semibold text-sky-700 dark:text-sky-300 truncate">
        {replyName}
      </p>
      <div className="flex items-center gap-1">
        {previewIcon}
        <p className={cn(
          "text-[12px] truncate",
          snippet.is_deleted ? "italic text-muted-foreground" : "text-muted-foreground",
        )}>
          {previewText}
        </p>
      </div>
    </button>
  );
};

const MessageBody = ({
  message,
  mine,
  highlight,
  onOpenImage,
}: {
  message: ChatMessage;
  mine: boolean;
  highlight?: string;
  onOpenImage: (url: string) => void;
}) => {
  if (message.message_type === "IMAGE" && message.file_url) {
    const caption = message.caption || message.content;
    return (
      <button
        type="button"
        data-no-private-menu
        onClick={(event) => {
          event.stopPropagation();
          onOpenImage(message.file_url!);
        }}
        className="block overflow-hidden rounded-md"
      >
        <img
          src={message.file_url}
          alt={message.file_name || "Imagen"}
          className="max-h-64 max-w-full object-cover hover:opacity-95 transition-opacity"
        />
        {caption && (
          <p className="text-[13.5px] leading-snug mt-1 text-left">
            <HighlightedText text={caption} highlight={highlight} />
          </p>
        )}
      </button>
    );
  }

  if (message.message_type === "AUDIO" && message.file_url) {
    return (
      <div data-no-private-menu onClick={(event) => event.stopPropagation()}>
        <AudioMessage src={message.file_url} accent={mine} />
      </div>
    );
  }

  if (
    (message.message_type === "PDF" || message.message_type === "DOCUMENT") &&
    message.file_url
  ) {
    return (
      <div data-no-private-menu onClick={(event) => event.stopPropagation()}>
        <DocumentCard
          url={message.file_url}
          name={message.file_name || "archivo"}
          kind={message.message_type === "PDF" ? "PDF" : "DOCUMENT"}
          messageId={message.id}
        />
      </div>
    );
  }

  return (
    <p className="text-[13.5px] leading-snug whitespace-pre-wrap break-words">
      <HighlightedText text={message.content ?? ""} highlight={highlight} />
    </p>
  );
};

/** Resalta las ocurrencias de `highlight` en el texto con fondo amarillo. */
const HighlightedText = ({
  text,
  highlight,
}: {
  text: string;
  highlight?: string;
}) => {
  if (!highlight || !text) return <>{text}</>;

  const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="bg-yellow-200 dark:bg-yellow-900/60 text-inherit rounded px-0.5"
          >
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
};


const DeliveryTicks = ({ status }: { status: ChatDeliveryStatus }) => {
  if (status === "read") {
    return (
      <CheckCheck
        size={14}
        className="text-sky-600"
        aria-label="Leído"
      />
    );
  }
  if (status === "delivered") {
    return (
      <CheckCheck
        size={14}
        className="text-muted-foreground"
        aria-label="Entregado"
      />
    );
  }
  return (
    <Check
      size={14}
      className="text-muted-foreground"
      aria-label="Enviado"
    />
  );
};
