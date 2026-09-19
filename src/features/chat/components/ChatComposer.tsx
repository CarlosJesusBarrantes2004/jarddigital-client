import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Image as ImageIcon,
  Mic,
  Paperclip,
  SendHorizontal,
  Smile,
  Square,
  FileText,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { uploadChatAssetToCloudinary } from "@/lib/cloudinary.utils";
import { useVoiceRecorder } from "../hooks/useVoiceRecorder";
import { messageTypeFromFile } from "../lib/chat.utils";
import type { SendMessagePayload } from "../types/chat.types";

const EMOJIS = [
  "😀", "😁", "😂", "🤣", "😊", "😍", "😘", "😎", "🤔", "😴",
  "😭", "😡", "👍", "👎", "🙏", "👏", "🔥", "✨", "💪", "🚀",
  "✅", "❌", "🎉", "❤️", "💙", "💚", "💛", "💯", "📌", "📎",
];

interface ChatComposerProps {
  disabled?: boolean;
  disabledReason?: string;
  onSend: (payload: SendMessagePayload) => Promise<void>;
  onTyping?: () => void;
}

export const ChatComposer = ({
  disabled,
  disabledReason,
  onSend,
  onTyping,
}: ChatComposerProps) => {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [pastedImage, setPastedImage] = useState<File | null>(null);
  const [pastedPreviewUrl, setPastedPreviewUrl] = useState<string | null>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);
  const txtRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recorder = useVoiceRecorder();

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [text]);

  // Cleanup ObjectURL on unmount or when preview changes
  useEffect(() => {
    return () => {
      if (pastedPreviewUrl) URL.revokeObjectURL(pastedPreviewUrl);
    };
  }, [pastedPreviewUrl]);

  const clearPastedImage = useCallback(() => {
    if (pastedPreviewUrl) URL.revokeObjectURL(pastedPreviewUrl);
    setPastedImage(null);
    setPastedPreviewUrl(null);
  }, [pastedPreviewUrl]);

  const canSend = useMemo(
    () => (text.trim().length > 0 || pastedImage !== null) && !sending && !disabled,
    [text, sending, disabled, pastedImage],
  );

  const submitText = async () => {
    if (!canSend) return;

    // If there's a pasted image, send it (with optional text as content)
    if (pastedImage) {
      const content = text.trim() || undefined;
      setText("");
      const imageToSend = pastedImage;
      clearPastedImage();
      setSending(true);
      try {
        const uploaded = await uploadChatAssetToCloudinary(imageToSend, "chat");
        await onSend({
          message_type: "IMAGE",
          content,
          file_url: uploaded.url,
          file_name: uploaded.name,
        });
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "No se pudo subir la imagen.",
        );
      } finally {
        setSending(false);
      }
      return;
    }

    // Text-only send
    const content = text.trim();
    setText("");
    setSending(true);
    try {
      await onSend({ content, message_type: "TEXT" });
    } catch (error) {
      setText(content);
      throw error;
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submitText();
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = Array.from(event.clipboardData.items);
    const imageItem = items.find((item) => item.type.startsWith("image/"));
    if (!imageItem) return; // no image in clipboard → default paste
    event.preventDefault();
    const file = imageItem.getAsFile();
    if (!file) return;
    // Revoke previous preview URL if any
    if (pastedPreviewUrl) URL.revokeObjectURL(pastedPreviewUrl);
    // Generate a friendly name: captura-YYYYMMDD-HHmmss.png
    const now = new Date();
    const ts = now.toISOString().replace(/[-:T]/g, "").slice(0, 14);
    const named = new File([file], `captura-${ts}.png`, { type: file.type });
    setPastedImage(named);
    setPastedPreviewUrl(URL.createObjectURL(named));
  };

  const uploadAndSend = async (file: File) => {
    setSending(true);
    try {
      const uploaded = await uploadChatAssetToCloudinary(file, "chat");
      await onSend({
        message_type: messageTypeFromFile(file),
        file_url: uploaded.url,
        file_name: uploaded.name,
      });
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

      {/* Pasted image preview */}
      {pastedImage && pastedPreviewUrl && (
        <div className="mb-2 flex items-center gap-3 bg-muted/60 border border-border rounded-xl px-3 py-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <img
            src={pastedPreviewUrl}
            alt="Vista previa"
            className="max-h-20 max-w-[120px] rounded-lg object-contain border border-border/50"
          />
          <span className="text-xs text-muted-foreground flex-1 truncate">
            {pastedImage.name}
          </span>
          <button
            type="button"
            onClick={clearPastedImage}
            className="size-6 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center"
            aria-label="Quitar imagen pegada"
          >
            <X size={14} />
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

      <div className="flex items-end gap-1.5">
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
            </div>
          )}
        </div>

        <textarea
          ref={textareaRef}
          value={text}
          rows={1}
          placeholder={pastedImage ? "Añade un mensaje (opcional)…" : "Escribe un mensaje"}
          onChange={(event) => {
            setText(event.target.value);
            onTyping?.();
          }}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          className="flex-1 resize-none bg-muted/60 border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-400/40 max-h-[120px]"
        />

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
