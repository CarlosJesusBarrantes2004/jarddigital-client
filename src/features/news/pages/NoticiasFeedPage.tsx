import { useEffect, useState } from "react";
import { Newspaper, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NoticiaCard } from "../components/NoticiaCard";
import { newsService } from "../services/news.service";
import type { Noticia } from "../types/news.types";

export const NoticiasFeedPage = () => {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(true);

  const cargar = async () => {
    setLoading(true);
    try {
      const data = await newsService.getAll();
      setNoticias(data);
    } catch {
      console.error("Error al cargar noticias");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  return (
    <div className="font-sans min-h-screen p-6 md:p-8 max-w-[1000px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-[clamp(1.5rem,3vw,2.1rem)] font-bold text-foreground leading-tight tracking-tight flex items-center gap-3">
            <Newspaper size={28} className="text-primary" />
            Noticias
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Mantente al tanto de las novedades y comunicados de la empresa.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={cargar}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Actualizar
        </Button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-64 rounded-2xl bg-muted/50 animate-pulse"
            />
          ))}
        </div>
      ) : noticias.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Newspaper size={48} className="mb-4 opacity-30" />
          <p className="text-lg font-medium">No hay noticias aún</p>
          <p className="text-sm">Cuando se publiquen noticias aparecerán aquí.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {noticias.map((n) => (
            <NoticiaCard key={n.id} noticia={n} />
          ))}
        </div>
      )}
    </div>
  );
};
