import { useRef, useState, useCallback } from "react";
import {
  Upload,
  X,
  CheckCircle2,
  Loader2,
  Music,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  uploadAudioToCloudinary,
  deleteAudioFromCloudinaryDirect,
} from "../../services/sales.service";

interface AudioUploadFieldProps {
  etiqueta: string;
  index: number;
  url: string | null;
  deleteToken?: string | null;
  uploading: boolean;
  error: string | null;
  onUploaded: (url: string, token?: string) => void;
  onRemove: () => void;
  onUploadStart: () => void;
  onUploadError: (err: string) => void;
  disabled?: boolean;
  isRechazado?: boolean;
  motivoRechazo?: string | null;
}

export function AudioUploadField({
  etiqueta,
  index,
  url,
  deleteToken,
  uploading,
  error,
  onUploaded,
  onRemove,
  onUploadStart,
  onUploadError,
  disabled,
  isRechazado,
  motivoRechazo,
}: AudioUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.includes("audio") && !file.name.endsWith(".mp3"))
        return onUploadError("Solo archivos .mp3");
      if (file.size > 30 * 1024 * 1024)
        return onUploadError("El archivo no debe superar 30MB");

      onUploadStart();
      setProgress(0);
      try {
        const result = await uploadAudioToCloudinary(file, setProgress);
        onUploaded(result.url, result.deleteToken);
      } catch (err) {
        onUploadError(
          err instanceof Error ? err.message : "Error al subir el audio",
        );
      }
    },
    [onUploaded, onUploadStart, onUploadError],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile, disabled],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = "";
    },
    [handleFile],
  );

  const handleRemoveClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // Si tenemos un deleteToken significa que se acaba de subir y podemos destruirlo
    if (deleteToken) {
      setIsDeleting(true);
      try {
        await deleteAudioFromCloudinaryDirect(deleteToken);
      } catch (e) {
        console.error("Fallo al borrar en Cloudinary", e);
      } finally {
        setIsDeleting(false);
        onRemove(); // Eliminamos de la interfaz pase lo que pase
      }
    } else {
      // Si es un audio antiguo (de Reingreso/Edicion) solo lo quitamos visualmente
      onRemove();
    }
  };

  const hasUrl = !!url;
  const isError = !!error;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-mono font-bold shrink-0 border",
            hasUrl && !isRechazado
              ? "bg-emerald-500/20 text-emerald-500 border-emerald-500/30"
              : isRechazado
                ? "bg-destructive/20 text-destructive border-destructive/30"
                : "bg-muted border-border text-muted-foreground",
          )}
        >
          {index + 1}
        </span>
        <p className="text-[11px] font-medium text-foreground/80 leading-tight truncate pr-2">
          {etiqueta}
        </p>
        {hasUrl && !isRechazado && (
          <CheckCircle2
            size={14}
            className="text-emerald-500 ml-auto shrink-0"
          />
        )}
        {isRechazado && (
          <AlertCircle
            size={14}
            className="text-destructive ml-auto shrink-0"
          />
        )}
      </div>

      <div
        onClick={() =>
          !disabled &&
          !uploading &&
          !isDeleting &&
          !hasUrl &&
          inputRef.current?.click()
        }
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "relative flex flex-col justify-center p-3 rounded-xl border transition-all duration-200 min-h-[52px]",
          disabled || uploading || isDeleting || hasUrl
            ? "cursor-default"
            : "cursor-pointer hover:bg-muted/50 border-dashed",
          isError
            ? "border-destructive/50 bg-destructive/5"
            : isRechazado
              ? "border-destructive/40 bg-destructive/10 shadow-[0_0_15px_rgba(248,113,113,0.1)]"
              : hasUrl
                ? "border-emerald-500/30 bg-emerald-500/5"
                : isDragging
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".mp3,audio/*"
          onChange={handleChange}
          className="hidden"
          disabled={disabled}
        />

        {uploading || isDeleting ? (
          <div className="flex items-center gap-3">
            <Loader2
              size={16}
              className={cn(
                "animate-spin shrink-0",
                isDeleting ? "text-destructive" : "text-primary",
              )}
            />
            <div className="flex-1 w-full">
              <p
                className={cn(
                  "text-[10px] font-mono mb-1.5",
                  isDeleting ? "text-destructive" : "text-primary",
                )}
              >
                {isDeleting ? "Borrando archivo..." : `Subiendo… ${progress}%`}
              </p>
              {!isDeleting && (
                <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        ) : hasUrl ? (
          <div className="flex flex-col gap-3 w-full">
            <div className="flex items-center gap-3 w-full">
              {isRechazado ? (
                <X size={16} className="text-destructive shrink-0" />
              ) : (
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <audio
                  controls
                  src={url!}
                  className="h-8 w-full invert dark:invert-0 sepia-[.1] hue-rotate-[180deg] saturate-[3] outline-none"
                  preload="none"
                />
              </div>
              {!disabled && (
                <button
                  type="button"
                  onClick={handleRemoveClick}
                  className="w-6 h-6 flex items-center justify-center rounded-full bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-colors shrink-0"
                  title="Eliminar audio y subir uno nuevo"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            {isRechazado && motivoRechazo && (
              <div className="flex items-start gap-2 bg-destructive/10 p-2 rounded-lg border border-destructive/20 w-full mt-1">
                <MessageSquare
                  size={12}
                  className="text-destructive mt-0.5 shrink-0"
                />
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-destructive uppercase tracking-widest leading-none mb-1">
                    Motivo de rechazo
                  </span>
                  <span className="text-[11px] text-destructive/90 leading-snug">
                    {motivoRechazo}
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : isError ? (
          <div className="flex items-center gap-3">
            <AlertCircle size={16} className="text-destructive shrink-0" />
            <div className="flex-1">
              <p className="text-[11px] text-destructive leading-tight">
                {error}
              </p>
              <p className="text-[9px] text-destructive/60 mt-0.5 uppercase tracking-widest font-mono">
                Click para reintentar
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0",
                isDragging
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {isDragging ? <Music size={14} /> : <Upload size={14} />}
            </div>
            <p
              className={cn(
                "text-[11px] font-medium transition-colors",
                isDragging ? "text-primary" : "text-muted-foreground",
              )}
            >
              {isDragging
                ? "Suelta el archivo aquí"
                : "Arrastra .mp3 o haz click"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
