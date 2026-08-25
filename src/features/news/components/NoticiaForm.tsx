import { useState, useRef } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { uploadImagenToCloudinary } from "@/lib/cloudinary.utils";
import type {
  Noticia,
  CreateNoticiaPayload,
} from "../types/news.types";

interface NoticiaFormProps {
  noticia?: Noticia | null;
  onSubmit: (payload: CreateNoticiaPayload) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const NoticiaForm = ({
  noticia,
  onSubmit,
  onCancel,
  isLoading = false,
}: NoticiaFormProps) => {
  const [titulo, setTitulo] = useState(noticia?.titulo ?? "");
  const [contenido, setContenido] = useState(noticia?.contenido ?? "");
  const [imagenUrl, setImagenUrl] = useState(noticia?.imagen_url ?? "");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadImagenToCloudinary(file, "noticias");
      setImagenUrl(url);
    } catch {
      // Cloudinary preset might not be configured yet
      alert(
        "Error al subir imagen. Verifica que el preset 'jard_imagenes' esté creado en Cloudinary."
      );
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !contenido.trim()) return;

    onSubmit({
      titulo: titulo.trim(),
      contenido: contenido.trim(),
      imagen_url: imagenUrl || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Título */}
      <div className="space-y-2">
        <Label htmlFor="titulo" className="text-sm font-medium">
          Título
        </Label>
        <Input
          id="titulo"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Título de la noticia..."
          className="h-11"
          required
        />
      </div>

      {/* Contenido */}
      <div className="space-y-2">
        <Label htmlFor="contenido" className="text-sm font-medium">
          Contenido
        </Label>
        <Textarea
          id="contenido"
          value={contenido}
          onChange={(e) => setContenido(e.target.value)}
          placeholder="Escribe el contenido de la noticia..."
          className="min-h-[150px] resize-y"
          required
        />
      </div>

      {/* Imagen */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Imagen (opcional)
        </Label>

        {imagenUrl ? (
          <div className="relative rounded-xl overflow-hidden border border-border">
            <img
              src={imagenUrl}
              alt="Vista previa"
              className="w-full h-48 object-cover"
            />
            <button
              type="button"
              onClick={() => setImagenUrl("")}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-destructive/90 text-destructive-foreground flex items-center justify-center hover:bg-destructive transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full h-32 rounded-xl border-2 border-dashed border-border hover:border-primary/40 bg-muted/30 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-colors cursor-pointer disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 size={24} className="animate-spin" />
            ) : (
              <ImagePlus size={24} />
            )}
            <span className="text-xs">
              {uploading
                ? "Subiendo..."
                : "Haz clic para subir una imagen"}
            </span>
          </button>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading || uploading}>
          {isLoading ? (
            <Loader2 size={16} className="animate-spin mr-2" />
          ) : null}
          {noticia ? "Guardar cambios" : "Publicar noticia"}
        </Button>
      </div>
    </form>
  );
};
