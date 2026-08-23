import { useEffect, useState } from "react";
import {
  Tag,
  Plus,
  Pencil,
  Trash2,
  MapPin,
  Loader2,
  Package,
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
    } catch {
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
                className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors group"
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
                    {p.territorios?.slice(0, 3).map((t, idx) => {
                      let label = "—";
                      if (t.nombre_distrito) {
                        label = `${t.nombre_distrito} (Distrito)`;
                      } else if (t.nombre_provincia) {
                        label = `${t.nombre_provincia} (Provincia)`;
                      } else if (t.nombre_departamento) {
                        label = `${t.nombre_departamento} (Departamento)`;
                      }
                      return (
                        <Badge key={idx} variant="outline" className="text-[10px] gap-1 py-0 px-1.5">
                          <MapPin size={8} />
                          {label}
                        </Badge>
                      );
                    })}
                    {(p.territorios?.length || 0) > 3 && (
                      <span className="text-[10px] text-muted-foreground">
                        +{p.territorios.length - 3} más
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground ml-2">{fecha}</span>
                    {!p.activo && (
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-amber-500 border-amber-500/30">
                        Inactivo
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(p)} className="h-8 w-8 p-0">
                    <Pencil size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteTarget(p)}
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

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
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
