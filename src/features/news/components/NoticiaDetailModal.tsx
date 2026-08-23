import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { User, Calendar, Newspaper, X } from "lucide-react";
import type { Noticia } from "../types/news.types";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NoticiaDetailModalProps {
  noticia: Noticia | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NoticiaDetailModal = ({ noticia, open, onOpenChange }: NoticiaDetailModalProps) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!noticia) return null;

  const fecha = new Date(noticia.creado_en).toLocaleDateString("es-PE", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-full max-w-full sm:max-w-3xl p-0 overflow-hidden gap-0 bg-background rounded-none sm:rounded-2xl border-0 sm:border border-border/50 shadow-2xl h-[100dvh] sm:h-auto sm:max-h-[90vh] flex flex-col">
          <DialogHeader className="sr-only">
            <DialogTitle>{noticia.titulo}</DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 overflow-auto custom-scrollbar">
            {/* Header Image - muestra la imagen completa, sin recortar */}
            {noticia.imagen_url ? (
              <div 
                className="relative w-full bg-muted/30 cursor-pointer"
                onClick={(e) => { e.stopPropagation(); setLightboxOpen(true); }}
              >
                <img 
                  src={noticia.imagen_url} 
                  alt={noticia.titulo} 
                  className="w-full h-auto max-h-[50vh] object-contain bg-black/5"
                />
              </div>
            ) : (
              <div className="relative w-full h-40 sm:h-48 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                <Newspaper size={48} className="text-primary/30" />
              </div>
            )}

            {/* Content */}
            <div className="p-6 sm:p-8 space-y-6">
              <div>
                <h1 className="text-2xl sm:text-4xl font-serif font-bold text-foreground leading-tight tracking-tight mb-4">
                  {noticia.titulo}
                </h1>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground font-medium flex-wrap">
                  <div className="flex items-center gap-1.5 bg-card/80 px-2 py-1 rounded-md backdrop-blur border border-border/50">
                    <User size={14} className="text-primary" />
                    <span>{noticia.nombre_autor || "Sistema"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-card/80 px-2 py-1 rounded-md backdrop-blur border border-border/50">
                    <Calendar size={14} className="text-primary" />
                    <span>{fecha}</span>
                  </div>
                </div>
              </div>

              <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-muted-foreground/90 leading-relaxed pt-2">
                {noticia.contenido.split('\n').map((paragraph, i) => (
                  <p key={i} className="mb-4">{paragraph}</p>
                ))}
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Lightbox para ver la imagen completa */}
      {lightboxOpen && noticia.imagen_url && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setLightboxOpen(false)}
        >
          <button 
            className="absolute top-4 right-4 z-[101] text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
            onClick={() => setLightboxOpen(false)}
          >
            <X size={24} />
          </button>
          <img 
            src={noticia.imagen_url} 
            alt={noticia.titulo} 
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};
