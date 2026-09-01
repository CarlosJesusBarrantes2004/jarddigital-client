import { useEffect, useRef, useState, type MouseEvent } from "react";
import {
  Check,
  CheckCheck,
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
import type { ChatDeliveryStatus, ChatMessage } from "../types/chat.types";
import {
  avatarTone,
  formatMessageClock,
  initials,
  resolveDeliveryStatus,
} from "../lib/chat.utils";
import { AudioMessage } from "./AudioMessage";
import { DocumentCard } from "./DocumentCard";
import { PrivateChatMenuContent } from "./MemberPrivateChatMenu";

interface MessageBubbleProps {
  message: ChatMessage;
  mine: boolean;
  showSender: boolean;
  canDelete: boolean;
  onDelete: (message: ChatMessage) => void;
  onOpenImage: (url: string) => void;
  onStartPrivateChat?: (userId: number) => void;
  onVisible?: (messageId: number) => void;
}

export const MessageBubble = ({
  message,
  mine,
  showSender,
  canDelete,
  onDelete,
  onOpenImage,
  onStartPrivateChat,
  onVisible,
}: MessageBubbleProps) => {
  const [privateMenuOpen, setPrivateMenuOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const reportedRef = useRef(false);
  const senderName = message.sender_nombre || "Usuario";
  const canPrivate = Boolean(
    onStartPrivateChat && !mine && message.sender,
  );

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
      className={cn("flex w-full gap-2", mine ? "justify-end" : "justify-start")}
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
          />
        </DropdownMenu>
      )}

      <div
        className={cn(
          "relative max-w-[78%] rounded-lg px-2.5 py-1.5 shadow-sm",
          mine
            ? "bg-[#d9fdd3] dark:bg-sky-900/55 rounded-br-none"
            : "bg-white dark:bg-secondary rounded-bl-none",
          canPrivate && "cursor-pointer",
        )}
        onClick={handleBubbleClick}
      >
        {showSender && !mine && (
          <button
            type="button"
            className={cn(
              "text-[11px] font-semibold text-sky-700 dark:text-sky-300 mb-0.5 text-left",
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

        {message.is_deleted ? (
          <p className="text-[13px] italic text-muted-foreground">
            Este mensaje fue eliminado
          </p>
        ) : (
          <MessageBody
            message={message}
            mine={mine}
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
          {canDelete && !message.is_deleted && (
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
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete(message)}
                >
                  <Trash2 size={14} />
                  Eliminar mensaje
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  );
};

const MessageBody = ({
  message,
  mine,
  onOpenImage,
}: {
  message: ChatMessage;
  mine: boolean;
  onOpenImage: (url: string) => void;
}) => {
  if (message.message_type === "IMAGE" && message.file_url) {
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
        {message.content && (
          <p className="text-[13.5px] leading-snug mt-1 text-left">{message.content}</p>
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
        />
      </div>
    );
  }

  return (
    <p className="text-[13.5px] leading-snug whitespace-pre-wrap break-words">
      {message.content}
    </p>
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
