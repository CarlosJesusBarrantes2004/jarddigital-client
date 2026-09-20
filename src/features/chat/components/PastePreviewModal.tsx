/**
 * Modal de previsualización de imagen pegada desde portapapeles.
 * Permite al usuario añadir un pie de foto (caption) antes de enviar.
 */
import { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PastePreviewModalProps {
  file: File;
  previewUrl: string;
  open: boolean;
  sending: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: (caption: string) => void;
  onCancel: () => void;
}

export const PastePreviewModal = ({
  file,
  previewUrl,
  open,
  sending,
  onOpenChange,
  onSend,
  onCancel,
}: PastePreviewModalProps) => {
  const captionRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const caption = captionRef.current?.value.trim() ?? "";
    onSend(caption);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Enviar imagen</DialogTitle>
          <DialogDescription>
            Añade un pie de foto opcional antes de enviar la captura.
          </DialogDescription>
        </DialogHeader>

        {/* Miniatura de la imagen */}
        <div className="rounded-xl overflow-hidden border border-border bg-muted/30 flex items-center justify-center max-h-64">
          <img
            src={previewUrl}
            alt="Vista previa de la captura"
            className="max-h-64 max-w-full object-contain"
          />
        </div>

        {/* Nombre del archivo */}
        <p className="text-xs text-muted-foreground truncate">{file.name}</p>

        {/* Campo de pie de foto */}
        <textarea
          ref={captionRef}
          rows={2}
          placeholder="Añade un pie de foto (opcional)…"
          onKeyDown={handleKeyDown}
          className="w-full resize-none bg-muted/60 border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-400/40 max-h-[80px]"
          autoFocus
        />

        {/* Acciones */}
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={sending}
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleSend}
            disabled={sending}
            className="bg-sky-500 hover:bg-sky-600 text-white"
          >
            {sending ? "Enviando…" : "Enviar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
