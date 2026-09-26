import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FileText,
  Image as ImageIcon,
  Mic,
  Music,
  Paperclip,
  SendHorizontal,
  Smile,
  Square,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { uploadChatAssetToCloudinary } from "@/lib/cloudinary.utils";
import { useVoiceRecorder } from "../hooks/useVoiceRecorder";
import { messageTypeFromFile } from "../lib/chat.utils";
import type { ChatMember, ChatMessage, SendMessagePayload } from "../types/chat.types";
import { MentionDropdown } from "./MentionDropdown";
import { PastePreviewModal } from "./PastePreviewModal";

const EMOJIS = [
  "😀", "😁", "😂", "🤣", "😊", "😍", "😘", "😎", "🤔", "😴",
  "😭", "😡", "👍", "👎", "🙏", "👏", "🔥", "✨", "💪", "🚀",
  "✅", "❌", "🎉", "❤️", "💙", "💚", "💛", "💯", "📌", "📎",
];

/** Regex para detectar un fragmento de mención activo: @ seguido de caracteres. */
const MENTION_REGEX = /@([^\s]*)$/;

interface ChatComposerProps {
  disabled?: boolean;
  disabledReason?: string;
  /** Miembros de la sala activa para el dropdown de menciones. */
  members?: ChatMember[];
  onSend: (payload: SendMessagePayload) => Promise<void>;
  onTyping?: () => void;
  replyTo?: ChatMessage | null;
  onCancelReply?: () => void;
}

export const ChatComposer = ({
  disabled,
  disabledReason,
  members = [],
  onSend,
  onTyping,
  replyTo,
  onCancelReply,
}: ChatComposerProps) => {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);

  // ── Imagen pegada desde portapapeles ────────────────────────────────────
  const [pastedImage, setPastedImage] = useState<File | null>(null);
  const [pastedPreviewUrl, setPastedPreviewUrl] = useState<string | null>(null);
  const [pasteModalOpen, setPasteModalOpen] = useState(false);

  // ── Menciones @usuario ──────────────────────────────────────────────────
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  /** IDs de usuarios que fueron etiquetados con @ en el mensaje actual */
  const mentionedIdsRef = useRef<Set<number>>(new Set());

  const imageRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);
  const txtRef = useRef<HTMLInputElement>(null);
  const audioFileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recorder = useVoiceRecorder();

  // Al elegir "Responder" el compositor puede haberse montado recién (por
  // ejemplo, al abrir un chat directo). Esperar al render evita que el foco se
  // pierda en el panel anterior y deja el cursor listo para escribir.
  useEffect(() => {
    if (!replyTo) return;
    const frame = window.requestAnimationFrame(() => textareaRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [replyTo]);

  useEffect(() => {
    const focusComposer = () => textareaRef.current?.focus();
    window.addEventListener("focus-chat-composer", focusComposer);
    return () => window.removeEventListener("focus-chat-composer", focusComposer);
  }, []);

  // Auto-resize del textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [text]);

  // Liberar objectURL al desmontar o cambiar preview
  useEffect(() => {
    return () => {
      if (pastedPreviewUrl) URL.revokeObjectURL(pastedPreviewUrl);
    };
  }, [pastedPreviewUrl]);

  const clearPastedImage = useCallback(() => {
    if (pastedPreviewUrl) URL.revokeObjectURL(pastedPreviewUrl);
    setPastedImage(null);
    setPastedPreviewUrl(null);
    setPasteModalOpen(false);
  }, [pastedPreviewUrl]);

  const canSend = useMemo(
    () => (text.trim().length > 0 || pastedImage !== null) && !sending && !disabled,
    [text, sending, disabled, pastedImage],
  );

  // ── Extrae IDs mencionados del texto final (para el payload) ───────────
  const extractMentionIds = (content: string): number[] => {
    const mentioned: number[] = [];
    const matches = content.match(/@(\S+)/g) ?? [];
    for (const match of matches) {
      const name = match.slice(1).toLowerCase();
      for (const m of members) {
        if (
          m.nombre_completo.toLowerCase() === name ||
          m.username.toLowerCase() === name
        ) {
          mentioned.push(m.user);
          break;
        }
      }
    }
    // Combinar con IDs acumulados del dropdown (más preciso)
    for (const id of mentionedIdsRef.current) {
      if (!mentioned.includes(id)) mentioned.push(id);
    }
    return mentioned;
  };

  // ── Envío de texto (con menciones) ─────────────────────────────────────
  const submitText = async () => {
    if (!canSend) return;

    const content = text.trim();
    const replyId = replyTo?.id ?? undefined;
    setText("");
    mentionedIdsRef.current.clear();
    setSending(true);

    try {
      await onSend({
        content,
        message_type: "TEXT",
        mentioned_user_ids: extractMentionIds(content),
        reply_to_id: replyId,
      });
      onCancelReply?.();
    } catch (error) {
      setText(content);
      throw error;
    } finally {
      setSending(false);
    }
  };

  // ── Envío de imagen pegada con caption ──────────────────────────────────
  const submitPastedImage = async (caption: string) => {
    if (!pastedImage) return;
    const imageToSend = pastedImage;
    clearPastedImage();
    setSending(true);
    try {
      const uploaded = await uploadChatAssetToCloudinary(imageToSend, "chat");
      await onSend({
        message_type: "IMAGE",
        content: text.trim() || undefined,
        caption,
        file_url: uploaded.url,
        file_name: uploaded.name,
        reply_to_id: replyTo?.id ?? undefined,
      });
      setText("");
      onCancelReply?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo subir la imagen.",
      );
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Si el dropdown de menciones está abierto, Escape lo cierra
    if (mentionQuery !== null && event.key === "Escape") {
      event.preventDefault();
      setMentionQuery(null);
      return;
    }

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submitText();
    }
  };

  // ── Detección de mención activa al escribir ─────────────────────────────
  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    setText(value);
    onTyping?.();

    // Detectar patrón @query al final del cursor
    const cursorPos = event.target.selectionStart ?? value.length;
    const textBeforeCursor = value.slice(0, cursorPos);
    const match = MENTION_REGEX.exec(textBeforeCursor);
    setMentionQuery(match ? match[1] : null);
  };

  // ── Selección de un miembro del dropdown de menciones ──────────────────
  const handleMentionSelect = (member: ChatMember) => {
    // Insertar @NombreCompleto en lugar del fragmento @query
    const cursorPos = textareaRef.current?.selectionStart ?? text.length;
    const textBeforeCursor = text.slice(0, cursorPos);
    const textAfterCursor = text.slice(cursorPos);
    const newText = textBeforeCursor.replace(MENTION_REGEX, `@${member.nombre_completo} `) + textAfterCursor;
    setText(newText);
    mentionedIdsRef.current.add(member.user);
    setMentionQuery(null);

    // Devolver foco al textarea después de la selección
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  // ── Interceptar pegado de imagen del portapapeles ───────────────────────
  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = Array.from(event.clipboardData.items);
    const imageItem = items.find((item) => item.type.startsWith("image/"));
    if (!imageItem) return; // no hay imagen → pegado normal
    event.preventDefault();
    const file = imageItem.getAsFile();
    if (!file) return;
    // Revocar preview anterior si lo hay
    if (pastedPreviewUrl) URL.revokeObjectURL(pastedPreviewUrl);
    // Nombre descriptivo: captura-YYYYMMDDHHMMSS.png
    const now = new Date();
    const ts = now.toISOString().replace(/[-:T]/g, "").slice(0, 14);
    const named = new File([file], `captura-${ts}.png`, { type: file.type });
    setPastedImage(named);
    setPastedPreviewUrl(URL.createObjectURL(named));
    // Abrir modal de caption
    setPasteModalOpen(true);
  };

  const uploadAndSend = async (file: File) => {
    const replyId = replyTo?.id ?? undefined;
    setSending(true);
    try {
      const uploaded = await uploadChatAssetToCloudinary(file, "chat");
      await onSend({
        message_type: messageTypeFromFile(file),
        file_url: uploaded.url,
        file_name: uploaded.name,
        reply_to_id: replyId,
      });
      onCancelReply?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo subir el archivo.",
      );
    } finally {
      setSending(false);
      setAttachOpen(false);
    }
  };

  const onFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void uploadAndSend(file);
  };

  const toggleMic = async () => {
    if (recorder.isRecording) {
      const file = await recorder.stop();
      if (file) await uploadAndSend(file);
      return;
    }
    try {
      await recorder.start();
    } catch {
      toast.error("No se pudo acceder al micrófono.");
    }
  };

  if (disabled) {
    return (
      <div className="px-4 py-3 bg-muted/40 border-t border-border text-center text-[13px] text-muted-foreground">
        {disabledReason || "Esta conversación está en solo lectura."}
      </div>
    );
  }

  return (
    <div className="px-3 py-2.5 bg-card border-t border-border">
      <input ref={imageRef} type="file" accept="image/*" hidden onChange={onFile} />
      <input ref={pdfRef} type="file" accept="application/pdf" hidden onChange={onFile} />
      <input ref={txtRef} type="file" accept=".txt,text/plain" hidden onChange={onFile} />
      <input ref={audioFileRef} type="file" accept="audio/*" hidden onChange={onFile} />

      {replyTo && (
        <div className="mb-2 flex items-center gap-3 rounded-lg border-l-4 border-sky-500 bg-muted/60 px-3 py-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-sky-600 dark:text-sky-400">
              Respondiendo a {replyTo.sender_nombre || "Usuario"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {replyTo.is_deleted
                ? "Este mensaje fue eliminado"
                : replyTo.message_type === "IMAGE"
                  ? "📷 Imagen"
                  : replyTo.message_type === "AUDIO"
                    ? "🎤 Audio"
                    : replyTo.message_type === "PDF"
                      ? "📄 PDF"
                      : replyTo.message_type === "DOCUMENT"
                        ? `📎 ${replyTo.file_name || "Documento"}`
                        : replyTo.content || "Mensaje"}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Cancelar respuesta"
            title="Cancelar respuesta"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {recorder.isRecording && (
        <div className="flex items-center gap-2 mb-2 px-2 text-sm text-red-600">
          <span className="size-2 rounded-full bg-red-500 animate-pulse" />
          Grabando nota de voz… {Math.floor(recorder.durationMs / 1000)}s
          <button
            type="button"
            onClick={recorder.cancel}
            className="ml-auto text-muted-foreground hover:text-foreground"
            aria-label="Cancelar grabación"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Modal de previsualización de imagen pegada */}
      {pastedImage && pastedPreviewUrl && (
        <PastePreviewModal
          file={pastedImage}
          previewUrl={pastedPreviewUrl}
          open={pasteModalOpen}
          sending={sending}
          onOpenChange={setPasteModalOpen}
          onSend={(caption) => void submitPastedImage(caption)}
          onCancel={clearPastedImage}
        />
      )}

      <div className="flex items-end gap-1.5">
        {/* Emoji picker */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setEmojiOpen((v) => !v);
              setAttachOpen(false);
            }}
            className="size-10 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center"
            aria-label="Emojis"
          >
            <Smile size={20} />
          </button>
          {emojiOpen && (
            <div className="absolute bottom-[calc(100%+8px)] left-0 z-40 w-64 rounded-xl border border-border bg-popover p-2 shadow-xl grid grid-cols-8 gap-1">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className="size-7 rounded hover:bg-muted text-lg"
                  onClick={() => {
                    setText((prev) => prev + emoji);
                    textareaRef.current?.focus();
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Adjuntar */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setAttachOpen((v) => !v);
              setEmojiOpen(false);
            }}
            className="size-10 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center"
            aria-label="Adjuntar"
          >
            <Paperclip size={20} />
          </button>
          {attachOpen && (
            <div className="absolute bottom-[calc(100%+8px)] left-0 z-40 w-48 rounded-xl border border-border bg-popover p-1.5 shadow-xl">
              <button
                type="button"
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm hover:bg-muted"
                onClick={() => imageRef.current?.click()}
              >
                <ImageIcon size={16} className="text-sky-600" /> Imagen
              </button>
              <button
                type="button"
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm hover:bg-muted"
                onClick={() => pdfRef.current?.click()}
              >
                <FileText size={16} className="text-red-500" /> PDF
              </button>
              <button
                type="button"
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm hover:bg-muted"
                onClick={() => txtRef.current?.click()}
              >
                <FileText size={16} className="text-sky-500" /> TXT
              </button>
              <button
                type="button"
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm hover:bg-muted"
                onClick={() => audioFileRef.current?.click()}
              >
                <Music size={16} className="text-emerald-500" /> Audio
              </button>
            </div>
          )}
        </div>

        {/* Textarea con dropdown de menciones */}
        <div className="relative flex-1">
          {/* MentionDropdown: aparece cuando mentionQuery no es null */}
          {mentionQuery !== null && (
            <MentionDropdown
              members={members}
              query={mentionQuery}
              onSelect={handleMentionSelect}
              onClose={() => setMentionQuery(null)}
            />
          )}

          <textarea
            ref={textareaRef}
            value={text}
            rows={1}
            placeholder="Escribe un mensaje"
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            className="w-full resize-none bg-muted/60 border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-400/40 max-h-[120px]"
          />
        </div>

        {/* Enviar / Grabar audio */}
        {canSend ? (
          <button
            type="button"
            onClick={() => void submitText()}
            disabled={sending}
            className="size-10 rounded-full bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center shadow-sm transition-colors"
            aria-label="Enviar"
          >
            <SendHorizontal size={18} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void toggleMic()}
            className={cn(
              "size-10 rounded-full flex items-center justify-center transition-colors",
              recorder.isRecording
                ? "bg-red-500 text-white"
                : "bg-sky-500 hover:bg-sky-600 text-white",
            )}
            aria-label={recorder.isRecording ? "Detener y enviar audio" : "Grabar audio"}
          >
            {recorder.isRecording ? <Square size={16} /> : <Mic size={18} />}
          </button>
        )}
      </div>
    </div>
  );
};
