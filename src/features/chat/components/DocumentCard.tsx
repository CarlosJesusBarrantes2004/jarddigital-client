/**
 * Tarjeta de documento (PDF o TXT/DOCUMENT) con:
 * - Descarga forzada via proxy backend (/api/chat/proxy-download/<messageId>/)
 *   para sortear restricciones CORS de Cloudinary.
 * - Botón de previsualización para PDF (abre en nueva pestaña).
 * - Codificación UTF-8 gestionada en el backend.
 */
import { useState } from "react";
import { Download, Eye, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/api/axios";

interface DocumentCardProps {
  url: string;
  name: string;
  kind: "PDF" | "DOCUMENT";
  messageId: number;
}

export const DocumentCard = ({ url, name, kind, messageId }: DocumentCardProps) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // Usamos el proxy del backend para evitar restricciones CORS de Cloudinary
      const proxyUrl = `/chat/proxy-download/${messageId}/`;
      const response = await api.get(proxyUrl, {
        responseType: "blob",
      });

      const blob = new Blob([response.data as BlobPart], {
        type: (response.headers["content-type"] as string) || "application/octet-stream",
      });
      const objectUrl = URL.createObjectURL(blob);

      // Crear enlace temporal y hacer click para descargar
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch {
      // Si el proxy falla (ej. backend sin requests), fallback a descarga directa
      const link = document.createElement("a");
      link.href = url;
      link.download = name;
      link.target = "_blank";
      link.rel = "noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.error("La descarga directa puede fallar por restricciones CORS.");
    } finally {
      setDownloading(false);
    }
  };

  const handlePreview = () => {
    // Abrir en nueva pestaña para previsualización (funciona con PDF viewer del navegador)
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-background/70 px-3 py-2.5 min-w-[220px] max-w-[280px]">
      <div className="size-10 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
        <FileText size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-foreground truncate">{name}</p>
        <p className="text-[11px] text-muted-foreground">
          {kind === "PDF" ? "PDF" : "Documento"}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {/* Previsualizar en pestaña (solo PDF) */}
        {kind === "PDF" && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePreview();
            }}
            className="size-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Previsualizar PDF"
            title="Previsualizar en pestaña"
          >
            <Eye size={14} />
          </button>
        )}
        {/* Descargar via proxy */}
        <button
          type="button"
          disabled={downloading}
          onClick={(e) => {
            e.stopPropagation();
            void handleDownload();
          }}
          className="size-7 rounded-lg hover:bg-muted flex items-center justify-center text-sky-600 hover:text-sky-700 transition-colors disabled:opacity-50"
          aria-label="Descargar archivo"
          title="Descargar"
        >
          {downloading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Download size={14} />
          )}
        </button>
      </div>
    </div>
  );
};
