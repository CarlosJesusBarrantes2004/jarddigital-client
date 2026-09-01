import {
  Check,
  CheckCheck,
  MoreVertical,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ChatMessage } from "../types/chat.types";
import { formatMessageClock } from "../lib/chat.utils";
import { AudioMessage } from "./AudioMessage";
import { DocumentCard } from "./DocumentCard";

interface MessageBubbleProps {
  message: ChatMessage;
  mine: boolean;
  showSender: boolean;
  canDelete: boolean;
  onDelete: (message: ChatMessage) => void;
  onOpenImage: (url: string) => void;
}

export const MessageBubble = ({
  message,
  mine,
  showSender,
  canDelete,
  onDelete,
  onOpenImage,
}: MessageBubbleProps) => {
  return (
    <div className={cn("flex w-full", mine ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "relative max-w-[78%] rounded-lg px-2.5 py-1.5 shadow-sm",
          mine
            ? "bg-[#d9fdd3] dark:bg-sky-900/55 rounded-br-none"
            : "bg-white dark:bg-secondary rounded-bl-none",
        )}
      >
        {showSender && !mine && (
          <p className="text-[11px] font-semibold text-sky-700 dark:text-sky-300 mb-0.5">
            {message.sender_nombre}
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
            onOpenImage={onOpenImage}
          />
        )}

        <div className="flex items-center justify-end gap-1 mt-0.5">
          <span className="text-[10px] text-muted-foreground">
            {formatMessageClock(message.created_at)}
          </span>
          {mine && !message.is_deleted && (
            message.is_read ? (
              <CheckCheck size={14} className="text-sky-600" />
            ) : (
              <Check size={14} className="text-muted-foreground" />
            )
          )}
          {canDelete && !message.is_deleted && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground p-0.5 rounded"
                  aria-label="Opciones del mensaje"
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
        onClick={() => onOpenImage(message.file_url!)}
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
    return <AudioMessage src={message.file_url} accent={mine} />;
  }

  if (
    (message.message_type === "PDF" || message.message_type === "DOCUMENT") &&
    message.file_url
  ) {
    return (
      <DocumentCard
        url={message.file_url}
        name={message.file_name || "archivo"}
        kind={message.message_type === "PDF" ? "PDF" : "DOCUMENT"}
      />
    );
  }

  return (
    <p className="text-[13.5px] leading-snug whitespace-pre-wrap break-words">
      {message.content}
    </p>
  );
};
