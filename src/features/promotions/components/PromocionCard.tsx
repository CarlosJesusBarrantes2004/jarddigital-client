import { Tag, MapPin, Package } from "lucide-react";
import type { Promocion } from "../types/promotions.types";
import { Badge } from "@/components/ui/badge";

interface PromocionCardProps {
  promocion: Promocion;
}

export const PromocionCard = ({ promocion }: PromocionCardProps) => {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20">
      {/* Imagen */}
      {promocion.imagen_url ? (
        <div className="relative h-44 w-full overflow-hidden">
          <img
            src={promocion.imagen_url}
            alt={promocion.titulo}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
        </div>
      ) : (
        <div className="h-32 w-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
          <Tag size={32} className="text-primary/30" />
        </div>
      )}

      {/* Body */}
      <div className="p-5">
        <h3 className="font-serif text-lg font-bold text-foreground leading-snug mb-2 line-clamp-2">
          {promocion.titulo ||
            (promocion.id_producto
              ? promocion.producto_nombre_campana
              : "Promoción sin título")}
        </h3>
        
        {promocion.id_producto && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-primary mb-2">
            <Package size={12} />
            S/ {promocion.producto_costo_fijo}
          </div>
        )}

        {promocion.descripcion && (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-4">
            {promocion.descripcion}
          </p>
        )}

        {/* Territorios */}
        {promocion.territorios && promocion.territorios.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {promocion.territorios.map((t, idx) => {
              const label =
                t.nombre_distrito ||
                t.nombre_provincia ||
                t.nombre_departamento ||
                "—";
              return (
                <Badge
                  key={idx}
                  variant="outline"
                  className="text-[10px] gap-1 text-muted-foreground"
                >
                  <MapPin size={10} />
                  {label}
                </Badge>
              );
            })}
          </div>
        )}
      </div>
    </article>
  );
};
