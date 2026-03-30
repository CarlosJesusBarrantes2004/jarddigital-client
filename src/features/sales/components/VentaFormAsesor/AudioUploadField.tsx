import { useRef, useState, useCallback, useEffect } from "react";
import {
  Upload,
  X,
  CheckCircle2,
  Loader2,
  Music,
  AlertCircle,
  MessageSquare,
  Mic,
  Square,
  Play,
  Pause,
  CircleDot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  uploadAudioToCloudinary,
  deleteAudioFromCloudinaryDirect,
} from "../../services/sales.service";

interface AudioUploadFieldProps {
  etiqueta: string;
  valorCliente?: string | null;
  index: number;
  url: string | null;
  deleteToken?: string | null;
  uploading: boolean;
  error: string | null;
  onUploaded: (url: string, token?: string) => void;
  onRemove: () => void;
  onUploadStart: () => void;
  onUploadError: (err: string) => void;
  // NUEVO: notifica al padre si hay una grabación pendiente de confirmar
  onPendienteConfirmar?: (pendiente: boolean) => void;
  disabled?: boolean;
  isRechazado?: boolean;
  motivoRechazo?: string | null;
}

// ── Grabador de audio interno ─────────────────────────────────────────────────

function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const isSupported =
    typeof window !== "undefined" &&
    !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setRecordedBlob(blob);
        setRecordedUrl(url);
        setIsPreviewing(true);
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start(200);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message.includes("Permission")
            ? "Permiso de micrófono denegado. Habilítalo en tu navegador."
            : err.message
          : "No se pudo acceder al micrófono",
      );
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isRecording]);

  const discardRecording = useCallback(() => {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedBlob(null);
    setRecordedUrl(null);
    setIsPreviewing(false);
    setRecordingSeconds(0);
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
  }, [recordedUrl]);

  const reset = useCallback(() => {
    discardRecording();
    setError(null);
  }, [discardRecording]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return {
    isSupported,
    isRecording,
    isPreviewing,
    recordedBlob,
    recordedUrl,
    recordingSeconds,
    error,
    formatTime,
    startRecording,
    stopRecording,
    discardRecording,
    reset,
  };
}

// ── Componente principal ──────────────────────────────────────────────────────

export function AudioUploadField({
  etiqueta,
  valorCliente,
  index,
  url,
  deleteToken,
  uploading,
  error,
  onUploaded,
  onRemove,
  onUploadStart,
  onUploadError,
  onPendienteConfirmar,
  disabled,
  isRechazado,
  motivoRechazo,
}: AudioUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showRecorder, setShowRecorder] = useState(false);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const previewAudioElRef = useRef<HTMLAudioElement | null>(null);

  const recorder = useAudioRecorder();

  // Notificar al padre cuando el estado de "pendiente de confirmar" cambia
  useEffect(() => {
    // Hay grabación pendiente si: el grabador está en modo preview (isPreviewing)
    // y todavía no se subió (no hay url final aún)
    const pendiente = recorder.isPreviewing && !url;
    onPendienteConfirmar?.(pendiente);
  }, [recorder.isPreviewing, url, onPendienteConfirmar]);

  // Convierte el blob grabado en File y lo sube a Cloudinary
  const handleUploadRecording = useCallback(async () => {
    if (!recorder.recordedBlob) return;
    const ext = recorder.recordedBlob.type.includes("webm") ? "webm" : "mp3";
    const file = new File(
      [recorder.recordedBlob],
      `grabacion_audio_${index + 1}.${ext}`,
      { type: recorder.recordedBlob.type },
    );
    onUploadStart();
    setProgress(0);
    try {
      const result = await uploadAudioToCloudinary(file, setProgress);
      recorder.discardRecording();
      setShowRecorder(false);
      onUploaded(result.url, result.deleteToken);
      // Al confirmar y subir, ya no hay pendiente — el useEffect lo detecta automáticamente
    } catch (err) {
      onUploadError(
        err instanceof Error ? err.message : "Error al subir la grabación",
      );
    }
  }, [recorder, index, onUploadStart, onUploaded, onUploadError]);

  const handleFile = useCallback(
    async (file: File) => {
      if (file.size > 50 * 1024 * 1024)
        return onUploadError("El archivo no debe superar 50MB");

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
    if (deleteToken) {
      setIsDeleting(true);
      try {
        await deleteAudioFromCloudinaryDirect(deleteToken);
      } catch (e) {
        console.error("Fallo al borrar en Cloudinary", e);
      } finally {
        setIsDeleting(false);
        onRemove();
      }
    } else {
      onRemove();
    }
  };

  const togglePreview = () => {
    if (!recorder.recordedUrl) return;
    if (!previewAudioElRef.current) {
      const el = new Audio(recorder.recordedUrl);
      el.onended = () => setPreviewPlaying(false);
      el.play();
      previewAudioElRef.current = el;
      setPreviewPlaying(true);
    } else {
      if (previewPlaying) {
        previewAudioElRef.current.pause();
        setPreviewPlaying(false);
      } else {
        previewAudioElRef.current.play();
        setPreviewPlaying(true);
      }
    }
  };

  // Al descartar la grabación también pausamos el preview
  const handleDiscard = () => {
    if (previewAudioElRef.current) {
      previewAudioElRef.current.pause();
      previewAudioElRef.current = null;
    }
    setPreviewPlaying(false);
    recorder.discardRecording();
    // Al descartar, ya no hay pendiente — el useEffect lo detecta
  };

  const hasUrl = !!url;
  const isError = !!error;
  const isBusy = uploading || isDeleting;

  return (
    <div className="flex flex-col gap-2">
      {/* ── Etiqueta con valor del cliente ── */}
      <div className="flex items-start gap-2">
        <span
          className={cn(
            "w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-mono font-bold shrink-0 border mt-0.5",
            hasUrl && !isRechazado
              ? "bg-emerald-500/20 text-emerald-500 border-emerald-500/30"
              : isRechazado
                ? "bg-destructive/20 text-destructive border-destructive/30"
                : "bg-muted border-border text-muted-foreground",
          )}
        >
          {index + 1}
        </span>
        <div className="flex flex-col flex-1 min-w-0 pr-2">
          <p className="text-[11px] font-medium text-foreground/80 leading-tight">
            {etiqueta}
          </p>
          {valorCliente && (
            <p
              className="text-[12px] font-sans font-medium text-foreground/70 leading-snug mt-0.5 break-words whitespace-normal"
              style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}
            >
              {valorCliente}
            </p>
          )}
        </div>
        {hasUrl && !isRechazado && (
          <CheckCircle2
            size={14}
            className="text-emerald-500 shrink-0 mt-0.5"
          />
        )}
        {isRechazado && (
          <AlertCircle size={14} className="text-destructive shrink-0 mt-0.5" />
        )}
      </div>

      {/* ── Panel de grabación ── */}
      {showRecorder && !hasUrl && !isBusy && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 flex flex-col gap-3">
          {recorder.error && (
            <p className="text-[11px] text-destructive flex items-center gap-1">
              <AlertCircle size={12} /> {recorder.error}
            </p>
          )}

          {!recorder.isRecording && !recorder.isPreviewing && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={recorder.startRecording}
                className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg bg-primary text-primary-foreground text-[12px] font-semibold hover:bg-primary/90 transition-colors"
              >
                <CircleDot size={14} className="text-red-300" />
                Iniciar grabación
              </button>
              <button
                type="button"
                onClick={() => {
                  recorder.reset();
                  setShowRecorder(false);
                }}
                className="h-9 px-3 rounded-lg border border-border text-muted-foreground hover:text-foreground text-[11px] transition-colors"
              >
                Cancelar
              </button>
            </div>
          )}

          {recorder.isRecording && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                <span className="text-[12px] font-mono text-red-500 font-bold">
                  REC {recorder.formatTime(recorder.recordingSeconds)}
                </span>
              </div>
              <button
                type="button"
                onClick={recorder.stopRecording}
                className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-destructive text-white text-[12px] font-semibold hover:bg-destructive/90 transition-colors"
              >
                <Square size={12} /> Detener
              </button>
            </div>
          )}

          {recorder.isPreviewing && recorder.recordedUrl && (
            <div className="flex flex-col gap-2">
              {/* AVISO PROMINENTE: indica que debe confirmar */}
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-2.5 py-1.5">
                <AlertCircle size={12} className="text-amber-500 shrink-0" />
                <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                  Debes confirmar la grabación para que quede registrada
                </p>
              </div>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                Vista previa — {recorder.formatTime(recorder.recordingSeconds)}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={togglePreview}
                  className={cn(
                    "w-8 h-8 rounded-full border flex items-center justify-center transition-all",
                    previewPlaying
                      ? "bg-primary/20 border-primary/40 text-primary"
                      : "bg-background border-border text-muted-foreground hover:bg-muted",
                  )}
                >
                  {previewPlaying ? (
                    <Pause size={13} />
                  ) : (
                    <Play size={13} className="ml-0.5" />
                  )}
                </button>
                <div className="flex-1 flex gap-2">
                  <button
                    type="button"
                    onClick={handleUploadRecording}
                    className="flex-1 h-8 rounded-lg bg-emerald-500 text-white text-[11px] font-semibold hover:bg-emerald-600 transition-colors"
                  >
                    ✓ Usar esta grabación
                  </button>
                  <button
                    type="button"
                    onClick={handleDiscard}
                    className="h-8 px-3 rounded-lg border border-border text-[11px] text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors"
                  >
                    Descartar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Zona de subida ── */}
      <div
        onClick={() =>
          !disabled &&
          !isBusy &&
          !hasUrl &&
          !showRecorder &&
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
          disabled || isBusy || hasUrl || showRecorder
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
          onChange={handleChange}
          className="hidden"
          disabled={disabled}
        />

        {isBusy ? (
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
                  title="Eliminar audio (también se borra de Cloudinary)"
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
        ) : showRecorder ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mic size={14} className="text-primary shrink-0" />
            <p className="text-[11px]">
              {recorder.isRecording
                ? "Grabando en curso…"
                : recorder.isPreviewing
                  ? "Revisa la grabación arriba"
                  : "Listo para grabar"}
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            {/* Botón micrófono */}
            {recorder.isSupported && !disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowRecorder(true);
                }}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10 text-primary hover:bg-primary/20 transition-colors shrink-0 border border-primary/20"
                title="Grabar desde el micrófono"
              >
                <Mic size={14} />
              </button>
            )}
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
                : "Arrastra cualquier audio o haz click"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
