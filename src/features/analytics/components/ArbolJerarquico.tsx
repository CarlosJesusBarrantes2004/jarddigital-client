import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Folder, Gem, Loader2, MapPin, Network } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useNivelJerarquico } from "../hooks/useAnalytics";
import {
  ESTADO_SOT_OPTIONS,
  MODALIDAD_OPTIONS,
  type DimensionJerarquica,
  type EstadoSOT,
  type MigaDePan,
  type Modalidad,
} from "../types/analytics.types";
import { coreService } from "@/features/core/services/coreService";

const DIMENSIONES: { value: DimensionJerarquica; label: string }[] = [
  { value: "GEOGRAFIA", label: "Geografía" },
  { value: "PRODUCTO", label: "Producto" },
];

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const DEPARTAMENTOS_NORTE = [
  "TUMBES", "PIURA", "LAMBAYEQUE", "LA LIBERTAD",
  "CAJAMARCA", "AMAZONAS", "SAN MARTÍN", "SAN MARTIN", "ÁNCASH", "ANCASH",
];

export const ArbolJerarquico = () => {
  const hoy = new Date();
  const [dimension, setDimension] = useState<DimensionJerarquica>("GEOGRAFIA");
  const [estadoSot, setEstadoSot] = useState<EstadoSOT>("ATENDIDO");
  const [soloAltoValor, setSoloAltoValor] = useState(false);
  const [migaDePan, setMigaDePan] = useState<MigaDePan[]>([]);
  const [modalidad, setModalidad] = useState<Modalidad | undefined>(undefined);
  const [idSede, setIdSede] = useState<number | undefined>(undefined);
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState<number | undefined>(undefined);

  const nivelActual = migaDePan.length;
  const padreActual = migaDePan[migaDePan.length - 1]?.item_id;

  // Fetch sedes para el select
  const { data: sedes } = useQuery({
    queryKey: ["core", "sucursales"],
    queryFn: coreService.getBranches,
    staleTime: 1000 * 60 * 10,
  });

  const { data, isLoading, isFetching } = useNivelJerarquico({
    estado_sot: estadoSot,
    dimension,
    nivel: nivelActual,
    anio,
    mes,
    padre_id: padreActual,
    solo_alto_valor: soloAltoValor,
    modalidad,
    id_sede: idSede,
  });

  // Cálculo del panel Norte
  const panelNorte = useMemo(() => {
    if (dimension !== "GEOGRAFIA" || nivelActual !== 0 || !data?.items?.length) return null;

    const totalGeneral = data.items.reduce((acc, item) => acc + item.total, 0);
    if (totalGeneral === 0) return null;

    const itemsNorte = data.items.filter((item) =>
      DEPARTAMENTOS_NORTE.some(
        (dep) => item.item_nombre.toUpperCase().trim() === dep
      )
    );

    const totalNorte = itemsNorte.reduce((acc, item) => acc + item.total, 0);
    const porcentaje = Math.round((totalNorte / totalGeneral) * 100);

    return { totalNorte, totalGeneral, porcentaje };
  }, [data, dimension, nivelActual]);

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

          {/* Filtro Sede */}
          {sedes && sedes.length > 0 && (
            <div className="relative">
              <select
                value={idSede ?? ""}
                onChange={(e) => {
                  setIdSede(e.target.value ? Number(e.target.value) : undefined);
                  setMigaDePan([]); // resetear drill-down
                }}
                className="h-9 pl-3 pr-8 rounded-lg border border-border bg-background text-[13px] font-medium appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Todas las sedes</option>
                {sedes
                  .filter((s) => s.activo)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre}
                    </option>
                  ))}
              </select>
              <ChevronDown
                size={13}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
            </div>
          )}

          {/* Filtro Modalidad */}
          <div className="relative">
            <select
              value={modalidad ?? ""}
              onChange={(e) => {
                setModalidad(
                  (e.target.value || undefined) as Modalidad | undefined,
                );
                setMigaDePan([]); // resetear drill-down
              }}
              className="h-9 pl-3 pr-8 rounded-lg border border-border bg-background text-[13px] font-medium appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Todas</option>
              {MODALIDAD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
          </div>

          {/* Filtro Mes */}
          <div className="relative">
            <select
              value={mes ?? ""}
              onChange={(e) => {
                setMes(e.target.value ? Number(e.target.value) : undefined);
                setMigaDePan([]);
              }}
              className="h-9 pl-3 pr-8 rounded-lg border border-border bg-background text-[13px] font-medium appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Todo el año</option>
              {MESES.map((m, i) => (
                <option key={i} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
          </div>

          {/* Filtro Año */}
          <div className="relative">
            <input
              type="number"
              min={2020}
              max={hoy.getFullYear() + 1}
              value={anio}
              onChange={(e) => {
                setAnio(Number(e.target.value));
                setMigaDePan([]);
              }}
              className="h-9 w-20 px-3 rounded-lg border border-border bg-background text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
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

      {/* Panel Norte */}
      {panelNorte && (
        <div className="flex items-center gap-3 mb-3 px-1">
          <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-lg">
            <MapPin size={14} />
            <span className="text-[12px] font-bold">
              Zona Norte: {panelNorte.totalNorte} ventas
            </span>
            <span className="text-[11px] font-medium opacity-70">
              ({panelNorte.porcentaje}% del total)
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground">
            Total general: {panelNorte.totalGeneral}
          </span>
        </div>
      )}

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
