import { useEffect, useState } from "react";
import {
  Newspaper,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  User,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { NoticiaForm } from "../components/NoticiaForm";
import { NoticiaDetailModal } from "../components/NoticiaDetailModal";
import { newsService } from "../services/news.service";
import type { Noticia, CreateNoticiaPayload } from "../types/news.types";
import { toast } from "sonner";

export const NoticiasAdminPage = () => {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNoticia, setEditingNoticia] = useState<Noticia | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Noticia | null>(null);
  const [detailTarget, setDetailTarget] = useState<Noticia | null>(null);

  const cargar = async () => {
    setLoading(true);
    try {
      const data = await newsService.getAll();
      setNoticias(data);
    } catch {
      toast.error("Error al cargar noticias");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const handleCreate = () => {
    setEditingNoticia(null);
    setDialogOpen(true);
  };

  const handleEdit = (noticia: Noticia) => {
    setEditingNoticia(noticia);
    setDialogOpen(true);
  };

  const handleSubmit = async (payload: CreateNoticiaPayload) => {
    setSaving(true);
    try {
      if (editingNoticia) {
        await newsService.update(editingNoticia.id, payload);
        toast.success("Noticia actualizada");
      } else {
        await newsService.create(payload);
        toast.success("Noticia publicada");
      }
      setDialogOpen(false);
      cargar();
    } catch {
      toast.error("Error al guardar la noticia");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await newsService.delete(deleteTarget.id);
      toast.success("Noticia eliminada");
      setDeleteTarget(null);
      cargar();
    } catch {
      toast.error("Error al eliminar la noticia");
    }
  };

  return (
    <div className="font-sans min-h-screen p-6 md:p-8 max-w-[1100px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-[clamp(1.5rem,3vw,2.1rem)] font-bold text-foreground leading-tight tracking-tight flex items-center gap-3">
            <Newspaper size={28} className="text-primary" />
            Gestión de Noticias
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Publica, edita y administra las noticias del sistema.
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus size={16} />
          Nueva noticia
        </Button>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 rounded-xl bg-muted/50 animate-pulse"
            />
          ))}
        </div>
      ) : noticias.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Newspaper size={48} className="mb-4 opacity-30" />
          <p className="text-lg font-medium">Sin noticias</p>
          <p className="text-sm mb-4">Publica la primera noticia del sistema.</p>
          <Button onClick={handleCreate} className="gap-2">
            <Plus size={16} />
            Crear primera noticia
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {noticias.map((n) => {
            const fecha = new Date(n.creado_en).toLocaleDateString("es-PE", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });
            return (
              <div
                key={n.id}
                className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors group cursor-pointer"
                onClick={() => setDetailTarget(n)}
              >
                {/* Thumbnail */}
                {n.imagen_url ? (
                  <img
                    src={n.imagen_url}
                    alt=""
                    className="w-16 h-16 rounded-lg object-cover shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Newspaper size={20} className="text-primary/50" />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm text-foreground truncate">
                    {n.titulo}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {n.contenido}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User size={10} />
                      {n.nombre_autor || "Sistema"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={10} />
                      {fecha}
                    </span>
                    {!n.activo && (
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-amber-500 border-amber-500/30">
                        Inactivo
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0 ml-auto">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); setDetailTarget(n); }}
                    className="h-8 w-8 p-0"
                  >
                    <Eye size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); handleEdit(n); }}
                    className="h-8 w-8 p-0"
                  >
                    <Pencil size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(n); }}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Dialog */}
      <NoticiaDetailModal 
        noticia={detailTarget}
        open={!!detailTarget}
        onOpenChange={(open) => !open && setDetailTarget(null)}
      />

      {/* Dialog: Crear / Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent aria-describedby={undefined} className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {editingNoticia ? "Editar noticia" : "Nueva noticia"}
            </DialogTitle>
          </DialogHeader>
          <NoticiaForm
            noticia={editingNoticia}
            onSubmit={handleSubmit}
            onCancel={() => setDialogOpen(false)}
            isLoading={saving}
          />
        </DialogContent>
      </Dialog>

      {/* Confirm Delete */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar noticia?</AlertDialogTitle>
            <AlertDialogDescription>
              Se desactivará la noticia &quot;{deleteTarget?.titulo}&quot;. Esta
              acción se puede revertir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
