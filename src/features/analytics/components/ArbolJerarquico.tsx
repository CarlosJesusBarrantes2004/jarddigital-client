import { useState } from "react";
import { ChevronRight, Folder, Gem, Loader2, Network } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNivelJerarquico } from "../hooks/useAnalytics";
import {
  ESTADO_SOT_OPTIONS,
  type DimensionJerarquica,
  type EstadoSOT,
  type MigaDePan,
} from "../types/analytics.types";

const DIMENSIONES: { value: DimensionJerarquica; label: string }[] = [
  { value: "GEOGRAFIA", label: "Geografía" },
  { value: "PRODUCTO", label: "Producto" },
];

export const ArbolJerarquico = () => {
  const [dimension, setDimension] = useState<DimensionJerarquica>("GEOGRAFIA");
  const [estadoSot, setEstadoSot] = useState<EstadoSOT>("ATENDIDO");
  const [soloAltoValor, setSoloAltoValor] = useState(false);
  const [migaDePan, setMigaDePan] = useState<MigaDePan[]>([]);

  const nivelActual = migaDePan.length;
  const padreActual = migaDePan[migaDePan.length - 1]?.item_id;

  const { data, isLoading, isFetching } = useNivelJerarquico({
    estado_sot: estadoSot,
    dimension,
    nivel: nivelActual,
    padre_id: padreActual,
    solo_alto_valor: soloAltoValor,
  });

  const cambiarDimension = (nueva: DimensionJerarquica) => {
    setDimension(nueva);
    setMigaDePan([]); // reseteamos drill-down al cambiar de dimensión
  };

  const entrarANivel = (item_id: string | number, item_nombre: string) => {
    if (!data?.tiene_siguiente_nivel) return;
    setMigaDePan((prev) => [
      ...prev,
      { nivel: nivelActual, item_id: String(item_id), item_nombre },
    ]);
  };

  const volverANivel = (indice: number) => {
    // indice = -1 significa volver a la raíz
    setMigaDePan((prev) => prev.slice(0, indice + 1));
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
        <div className="flex items-center gap-2">
          <Network size={16} className="text-primary" />
          <h3 className="text-[14px] font-semibold text-foreground">
            Distribución Jerárquica
          </h3>
          {isFetching && !isLoading && (
            <Loader2 size={13} className="animate-spin text-muted-foreground" />
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Toggle de dimensión estilo segmented control */}
          <div className="flex items-center rounded-lg border border-border p-0.5 bg-muted/40">
            {DIMENSIONES.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => cambiarDimension(d.value)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors",
                  dimension === d.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {d.label}
              </button>
            ))}
          </div>

          <select
            value={estadoSot}
            onChange={(e) => setEstadoSot(e.target.value as EstadoSOT)}
            className="h-9 px-3 rounded-lg border border-border bg-background text-[13px] font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {ESTADO_SOT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setSoloAltoValor((v) => !v)}
            className={cn(
              "h-9 px-3 rounded-lg border text-[12px] font-medium flex items-center gap-1.5 transition-colors",
              soloAltoValor
                ? "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            <Gem size={13} />
            Alto Valor
          </button>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-[12px] mb-3 flex-wrap">
        <button
          type="button"
          onClick={() => volverANivel(-1)}
          className={cn(
            "px-2 py-1 rounded-md font-medium transition-colors",
            migaDePan.length === 0
              ? "text-primary bg-primary/10"
              : "text-muted-foreground hover:text-foreground hover:bg-muted",
          )}
        >
          {dimension === "GEOGRAFIA" ? "Departamentos" : "Campañas"}
        </button>
        {migaDePan.map((miga, i) => (
          <span key={miga.item_id} className="flex items-center gap-1">
            <ChevronRight size={12} className="text-muted-foreground/50" />
            <button
              type="button"
              onClick={() => volverANivel(i)}
              className={cn(
                "px-2 py-1 rounded-md font-medium transition-colors",
                i === migaDePan.length - 1
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              {miga.item_nombre}
            </button>
          </span>
        ))}
      </div>

      {/* Tabla de items del nivel actual */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 size={20} className="animate-spin text-muted-foreground" />
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-[13px] text-muted-foreground">
          Sin datos en este nivel.
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          {data.items.map((item, i) => {
            const maxTotal = data.items[0].total || 1;
            const porcentaje = Math.round((item.total / maxTotal) * 100);
            const esClickeable = data.tiene_siguiente_nivel;

            return (
              <button
                key={item.item_id}
                type="button"
                disabled={!esClickeable}
                onClick={() => entrarANivel(item.item_id, item.item_nombre)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors relative overflow-hidden",
                  i !== data.items.length - 1 && "border-b border-border",
                  esClickeable
                    ? "hover:bg-muted/40 cursor-pointer"
                    : "cursor-default",
                )}
              >
                {/* Barra de fondo proporcional al total, sutil */}
                <div
                  className="absolute inset-y-0 left-0 bg-primary/5"
                  style={{ width: `${porcentaje}%` }}
                />
                <div className="relative flex items-center gap-2 flex-1 min-w-0">
                  {esClickeable && (
                    <Folder
                      size={14}
                      className="text-muted-foreground shrink-0"
                    />
                  )}
                  <span className="text-[13px] text-foreground truncate">
                    {item.item_nombre}
                  </span>
                </div>
                <span className="relative text-[13px] font-semibold text-foreground shrink-0">
                  {item.total}
                </span>
                {esClickeable && (
                  <ChevronRight
                    size={14}
                    className="relative text-muted-foreground shrink-0"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
