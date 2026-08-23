import { Calendar, User } from "lucide-react";
import type { Noticia } from "../types/news.types";
import { useState } from "react";
import { NoticiaDetailModal } from "./NoticiaDetailModal";

interface NoticiaCardProps {
  noticia: Noticia;
}

export const NoticiaCard = ({ noticia }: NoticiaCardProps) => {
  const [open, setOpen] = useState(false);

  const fechaFormateada = new Date(noticia.creado_en).toLocaleDateString(
    "es-PE",
    { day: "numeric", month: "long", year: "numeric" }
  );

  return (
    <>
      <article 
        className="group relative overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 cursor-pointer"
        onClick={() => setOpen(true)}
      >
        {/* Imagen */}
      {noticia.imagen_url && (
        <div className="relative h-48 w-full overflow-hidden">
          <img
            src={noticia.imagen_url}
            alt={noticia.titulo}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
        </div>
      )}

      {/* Contenido */}
      <div className="p-5">
        <h3 className="font-serif text-lg font-bold text-foreground leading-snug mb-2 line-clamp-2">
          {noticia.titulo}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-4">
          {noticia.contenido}
        </p>

        {/* Footer */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-3 border-t border-border/50">
          <span className="flex items-center gap-1.5">
            <User size={12} className="text-primary/60" />
            {noticia.nombre_autor || "Sistema"}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar size={12} className="text-primary/60" />
            {fechaFormateada}
          </span>
        </div>
      </article>

      <NoticiaDetailModal 
        noticia={noticia}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
};
