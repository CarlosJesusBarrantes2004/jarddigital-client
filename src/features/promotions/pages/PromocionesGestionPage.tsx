import { useEffect, useState } from "react";
import {
  Tag,
  Plus,
  Pencil,
  Trash2,
  MapPin,
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
import { PromocionForm } from "../components/PromocionForm";
import { PromocionDetailModal } from "../components/PromocionDetailModal";
import { promotionsService } from "../services/promotions.service";
import type { Promocion, CreatePromocionPayload } from "../types/promotions.types";
import { toast } from "sonner";

export const PromocionesGestionPage = () => {
  const [promociones, setPromociones] = useState<Promocion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Promocion | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Promocion | null>(null);
  const [detailTarget, setDetailTarget] = useState<Promocion | null>(null);

  const cargar = async () => {
    setLoading(true);
    try {
      const data = await promotionsService.getAll();
      setPromociones(data);
    } catch {
      toast.error("Error al cargar promociones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const handleCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const handleEdit = (p: Promocion) => {
    setEditing(p);
    setDialogOpen(true);
  };

  const handleSubmit = async (payload: CreatePromocionPayload) => {
    setSaving(true);
    try {
      if (editing) {
        await promotionsService.update(editing.id, payload);
        toast.success("Promoción actualizada");
      } else {
        await promotionsService.create(payload);
        toast.success("Promoción creada");
      }
      setDialogOpen(false);
      cargar();
    } catch (err) {
      console.error("Error al guardar promoción:", err);
      toast.error("Error al guardar la promoción");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await promotionsService.delete(deleteTarget.id);
      toast.success("Promoción eliminada");
      setDeleteTarget(null);
      cargar();
    } catch {
      toast.error("Error al eliminar");
    }
  };

  return (
    <div className="font-sans min-h-screen p-6 md:p-8 max-w-[1100px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-[clamp(1.5rem,3vw,2.1rem)] font-bold text-foreground leading-tight tracking-tight flex items-center gap-3">
            <Tag size={28} className="text-primary" />
            Gestión de Promociones
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Administra las promociones y asígnalas a territorios.
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus size={16} />
          Nueva promoción
        </Button>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : promociones.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Tag size={48} className="mb-4 opacity-30" />
          <p className="text-lg font-medium">Sin promociones</p>
          <p className="text-sm mb-4">Crea la primera promoción del sistema.</p>
          <Button onClick={handleCreate} className="gap-2">
            <Plus size={16} />
            Crear primera promoción
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {promociones.map((p) => {
            const fecha = new Date(p.creado_en).toLocaleDateString("es-PE", {
              day: "numeric", month: "short", year: "numeric",
            });
            return (
              <div
                key={p.id}
                className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors group cursor-pointer"
                onClick={() => setDetailTarget(p)}
              >
                {/* Thumbnail */}
                {p.imagen_url ? (
                  <img src={p.imagen_url} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Tag size={20} className="text-primary/50" />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm text-foreground truncate">
                    {p.titulo ||
                      (p.id_producto
                        ? p.producto_nombre_campana
                        : "Promoción sin título")}
                  </h3>
                  
                  {/* Price removed because promotion is by campaign now */}

                  {p.descripcion && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{p.descripcion}</p>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    {(() => {
                      const deptos = p.territorios?.filter(t => t.id_departamento && !t.id_provincia && !t.id_distrito) || [];
                      const provs = p.territorios?.filter(t => t.id_provincia && !t.id_distrito) || [];
                      const dists = p.territorios?.filter(t => t.id_distrito) || [];
                      
                      return (
                        <>
                          {deptos.length > 0 && (
                            <Badge variant="outline" className="text-[10px] gap-1 py-0 px-1.5" title={deptos.map(d => d.nombre_departamento).join(", ")}>
                              <MapPin size={8} /> {deptos.length} {deptos.length === 1 ? 'Departamento' : 'Departamentos'}
                            </Badge>
                          )}
                          {provs.length > 0 && (
                            <Badge variant="outline" className="text-[10px] gap-1 py-0 px-1.5" title={provs.map(pr => pr.nombre_provincia).join(", ")}>
                              <MapPin size={8} /> {provs.length} {provs.length === 1 ? 'Provincia' : 'Provincias'}
                            </Badge>
                          )}
                          {dists.length > 0 && (
                            <Badge variant="outline" className="text-[10px] gap-1 py-0 px-1.5" title={dists.map(d => d.nombre_distrito).join(", ")}>
                              <MapPin size={8} /> {dists.length} {dists.length === 1 ? 'Distrito' : 'Distritos'}
                            </Badge>
                          )}
                          {(!p.territorios || p.territorios.length === 0) && (
                            <span className="text-[10px] text-muted-foreground italic">Sin territorios asignados</span>
                          )}
                        </>
                      );
                    })()}

                    <span className="text-[10px] text-muted-foreground ml-2">{fecha}</span>
                    {p.fecha_vencimiento && (
                      <span className="text-[10px] text-amber-500/90 dark:text-amber-400 ml-1">
                        · Vence {new Date(p.fecha_vencimiento + "T00:00:00").toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0 ml-auto">
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setDetailTarget(p); }} className="h-8 w-8 p-0">
                    <Eye size={14} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleEdit(p); }} className="h-8 w-8 p-0">
                    <Pencil size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(p); }}
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
      <PromocionDetailModal 
        promocion={detailTarget}
        open={!!detailTarget}
        onOpenChange={(open) => !open && setDetailTarget(null)}
      />

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent aria-describedby={undefined} className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {editing ? "Editar promoción" : "Nueva promoción"}
            </DialogTitle>
          </DialogHeader>
          <PromocionForm
            promocion={editing}
            onSubmit={handleSubmit}
            onCancel={() => setDialogOpen(false)}
            isLoading={saving}
          />
        </DialogContent>
      </Dialog>

      {/* Confirm Delete */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar promoción?</AlertDialogTitle>
            <AlertDialogDescription>
              Se desactivará &quot;{deleteTarget?.titulo}&quot;. Esta acción se puede revertir.
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
