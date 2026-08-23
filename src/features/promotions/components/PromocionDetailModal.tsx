import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MapPin, Package, Tag, Calendar } from "lucide-react";
import type { Promocion } from "../types/promotions.types";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PromocionDetailModalProps {
  promocion: Promocion | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PromocionDetailModal = ({ promocion, open, onOpenChange }: PromocionDetailModalProps) => {
  if (!promocion) return null;

  const fecha = new Date(promocion.creado_en).toLocaleDateString("es-PE", {
    day: "numeric", month: "long", year: "numeric"
  });

  const deptos = promocion.territorios?.filter(t => t.id_departamento && !t.id_provincia && !t.id_distrito) || [];
  const provs = promocion.territorios?.filter(t => t.id_provincia && !t.id_distrito) || [];
  const dists = promocion.territorios?.filter(t => t.id_distrito) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden gap-0 bg-background sm:rounded-2xl border-border/50 shadow-2xl h-[95vh] sm:h-auto sm:max-h-[90vh] flex flex-col">
        {/* Usamos sr-only para que shadcn no arroje warnings de accesibilidad */}
        <DialogHeader className="sr-only">
          <DialogTitle>{promocion.titulo}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-auto custom-scrollbar">
          {/* Header Image */}
          {promocion.imagen_url ? (
            <div className="relative w-full h-56 sm:h-72 bg-muted/30">
              <img 
                src={promocion.imagen_url} 
                alt={promocion.titulo} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
            </div>
          ) : (
            <div className="relative w-full h-40 sm:h-48 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
              <Tag size={48} className="text-primary/30" />
              <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
            </div>
          )}

          {/* Content */}
          <div className="p-6 sm:p-8 -mt-16 sm:-mt-20 relative z-10 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary" className="bg-primary/20 text-primary hover:bg-primary/30 text-xs font-semibold px-2.5 py-0.5">
                  Promoción
                </Badge>
                {!promocion.activo && (
                  <Badge variant="destructive" className="text-xs px-2.5 py-0.5">Inactivo</Badge>
                )}
              </div>
              <h1 className="text-2xl sm:text-4xl font-serif font-bold text-foreground leading-tight tracking-tight">
                {promocion.titulo || (promocion.id_producto ? promocion.producto_nombre_campana : "Promoción sin título")}
              </h1>
              
              <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground font-medium flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Calendar size={14} className="opacity-70" />
                  <span>Publicado el {fecha}</span>
                </div>
                {promocion.id_producto && (
                  <div className="flex items-center gap-1.5">
                    <Package size={14} className="opacity-70" />
                    <span>Campaña base: {promocion.producto_nombre_campana}</span>
                  </div>
                )}
              </div>
            </div>

            {promocion.descripcion && (
              <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-muted-foreground/90 leading-relaxed">
                {promocion.descripcion.split('\n').map((paragraph, i) => (
                  <p key={i} className="mb-2">{paragraph}</p>
                ))}
              </div>
            )}

            {/* Zonas de Cobertura */}
            {promocion.territorios && promocion.territorios.length > 0 && (
              <div className="pt-6 border-t border-border/50">
                <h3 className="text-lg font-serif font-semibold mb-4 flex items-center gap-2 text-foreground">
                  <MapPin size={18} className="text-primary" />
                  Zonas de Cobertura
                </h3>
                <div className="space-y-4">
                  {deptos.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Departamentos ({deptos.length})</p>
                      <div className="flex flex-wrap gap-1.5">
                        {deptos.map((d, i) => (
                          <Badge key={i} variant="outline" className="bg-card/50 text-foreground/80 font-normal hover:bg-muted">{d.nombre_departamento}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {provs.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Provincias ({provs.length})</p>
                      <div className="flex flex-wrap gap-1.5">
                        {provs.map((p, i) => (
                          <Badge key={i} variant="outline" className="bg-card/50 text-foreground/80 font-normal hover:bg-muted">{p.nombre_provincia}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {dists.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Distritos ({dists.length})</p>
                      <div className="flex flex-wrap gap-1.5">
                        {dists.map((d, i) => (
                          <Badge key={i} variant="outline" className="bg-card/50 text-foreground/80 font-normal hover:bg-muted">{d.nombre_distrito}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
