import { useState, useRef, useEffect } from "react";
import { ImagePlus, X, Loader2, MapPin, Pencil, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { uploadImagenToCloudinary } from "@/lib/cloudinary.utils";
import { promotionsService } from "../services/promotions.service";
import { catalogosService } from "@/features/sales/services/sales.service";
import type { Producto } from "@/features/sales/types/sales.types";
import type {
  Promocion,
  CreatePromocionPayload,
  Departamento,
} from "../types/promotions.types";
import {
  TerritorioSheet,
  buildTerritorioPayload,
  buildTerritorioSummary,
  type TerritorioEntry,
} from "./TerritorioSheet";

interface PromocionFormProps {
  promocion?: Promocion | null;
  onSubmit: (payload: CreatePromocionPayload) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const PromocionForm = ({
  promocion,
  onSubmit,
  onCancel,
  isLoading = false,
}: PromocionFormProps) => {
  const [titulo, setTitulo] = useState(promocion?.titulo ?? "");
  const [descripcion, setDescripcion] = useState(promocion?.descripcion ?? "");
  const [imagenUrl, setImagenUrl] = useState(promocion?.imagen_url ?? "");
  const [fechaVencimiento, setFechaVencimiento] = useState(promocion?.fecha_vencimiento ?? "");
  const [idProducto, setIdProducto] = useState<string>(promocion?.id_producto?.toString() ?? "");
  const [uploading, setUploading] = useState(false);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);

  // Territory state (managed by TerritorioSheet)
  const [todosDepartamentos, setTodosDepartamentos] = useState(false);
  const [entries, setEntries] = useState<TerritorioEntry[]>([{
    id_departamento: null,
    nombre_departamento: "",
    todasProvincias: false,
    provincias: [],
    provinciaSelections: [],
    expanded: true,
  }]);
  const [sheetOpen, setSheetOpen] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  // Sincronizar estado cuando cambia la promoción (al editar diferentes)
  useEffect(() => {
    setTitulo(promocion?.titulo ?? "");
    setDescripcion(promocion?.descripcion ?? "");
    setImagenUrl(promocion?.imagen_url ?? "");
    setFechaVencimiento(promocion?.fecha_vencimiento ?? "");
    setIdProducto(promocion?.id_producto?.toString() ?? "");
  }, [promocion]);

  // Cargar departamentos y productos al montar
  useEffect(() => {
    promotionsService.getDepartamentos().then(setDepartamentos);
    catalogosService.getProductos().then(setProductos);
  }, []);

  // Agrupar productos por nombre_campana para el dropdown
  const uniqueCampaigns = Array.from(
    new Map(productos.filter(p => p.nombre_campana).map(p => [p.nombre_campana, p])).values()
  );

  // Pre-cargar territorios existentes al editar
  useEffect(() => {
    const loadTerritorios = async () => {
      if (promocion?.territorios && promocion.territorios.length > 0) {
        // "Todos los departamentos" case
        const hasTodosDeptos = promocion.territorios.some(
          (t) => !t.id_departamento && !t.id_provincia && !t.id_distrito
        );
        if (hasTodosDeptos) {
          setTodosDepartamentos(true);
          setEntries([{
            id_departamento: null,
            nombre_departamento: "",
            todasProvincias: false,
            provincias: [],
            provinciaSelections: [],
            expanded: true,
          }]);
          return;
        }

        // Group by departamento
        const deptoGroups = new Map<number, typeof promocion.territorios>();
        for (const t of promocion.territorios) {
          if (!t.id_departamento) continue;
          if (!deptoGroups.has(t.id_departamento)) deptoGroups.set(t.id_departamento, []);
          deptoGroups.get(t.id_departamento)!.push(t);
        }

        const newEntries: TerritorioEntry[] = await Promise.all(
          Array.from(deptoGroups.entries()).map(async ([deptoId, terrs]) => {
            const first = terrs[0];
            const deptoName = first.nombre_departamento ?? departamentos.find(d => d.id === deptoId)?.nombre ?? "";

            // Load provinces for this depto
            let provincias = await promotionsService.getProvincias(deptoId).catch(() => []);

            // Is "todas las provincias"?
            const todasProvs = terrs.length === 1 && !first.id_provincia && !first.id_distrito;

            // Build province selections
            const provGroups = new Map<number, typeof terrs>();
            for (const t of terrs) {
              if (t.id_provincia) {
                if (!provGroups.has(t.id_provincia)) provGroups.set(t.id_provincia, []);
                provGroups.get(t.id_provincia)!.push(t);
              }
            }

            const provinciaSelections = await Promise.all(
              provincias.map(async (prov) => {
                const provTerrs = provGroups.get(prov.id);
                if (!provTerrs) {
                  return {
                    id: prov.id,
                    nombre: prov.nombre,
                    allDistricts: false,
                    selectedDistricts: [] as number[],
                    distritos: [],
                    loadedDistritos: false,
                    expanded: false,
                  };
                }

                // Load districts for this province
                const distritos = await promotionsService.getDistritos(prov.id).catch(() => []);
                const allDists = provTerrs.length === 1 && !provTerrs[0].id_distrito;
                const distIds = provTerrs.filter(t => t.id_distrito).map(t => t.id_distrito!);

                return {
                  id: prov.id,
                  nombre: prov.nombre,
                  allDistricts: allDists,
                  selectedDistricts: distIds,
                  distritos,
                  loadedDistritos: true,
                  expanded: false,
                };
              })
            );

            return {
              id_departamento: deptoId,
              nombre_departamento: deptoName,
              todasProvincias: !!todasProvs,
              provincias,
              provinciaSelections,
              expanded: false,
            };
          })
        );

        setTodosDepartamentos(false);
        setEntries(newEntries);
      } else {
        setTodosDepartamentos(false);
        setEntries([{
          id_departamento: null,
          nombre_departamento: "",
          todasProvincias: false,
          provincias: [],
          provinciaSelections: [],
          expanded: true,
        }]);
      }
    };
    loadTerritorios();
  }, [promocion, departamentos]);

  /* ─── Image upload ─── */
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImagenToCloudinary(file, "promociones");
      setImagenUrl(url);
    } catch {
      alert("Error al subir imagen. Verifica el preset 'jard_imagenes' en Cloudinary.");
    } finally {
      setUploading(false);
    }
  };

  /* ─── Territory summary for display ─── */
  const territoryCount = buildTerritorioPayload(todosDepartamentos, entries).length;
  const territorySummary = buildTerritorioSummary(todosDepartamentos, entries);
  const hasTerritory = todosDepartamentos || entries.some(e => e.id_departamento);

  /* ─── Submit ─── */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() && !idProducto) {
      alert("Debe ingresar un título o seleccionar un producto.");
      return;
    }

    const terrPayload = buildTerritorioPayload(todosDepartamentos, entries);

    onSubmit({
      titulo: titulo.trim() || null,
      descripcion: descripcion.trim() || null,
      imagen_url: imagenUrl || null,
      fecha_vencimiento: fechaVencimiento || null,
      id_producto: idProducto && idProducto !== "null" ? parseInt(idProducto) : null,
      territorios: terrPayload,
    });
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
        
        {/* Producto vinculado */}
        <div className="space-y-2">
          <Label htmlFor="promo-producto">Producto Vinculado (Opcional)</Label>
          <Select value={idProducto} onValueChange={setIdProducto}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Seleccionar producto..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="null" className="text-muted-foreground italic">Ninguno (Crear promoción independiente)</SelectItem>
              {uniqueCampaigns.map((p) => (
                <SelectItem key={p.id} value={p.id.toString()}>
                  {p.nombre_campana}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Título */}
        <div className="space-y-2">
          <Label htmlFor="promo-titulo">Título {idProducto && idProducto !== "null" ? "(Opcional si usas el del producto)" : ""}</Label>
          <Input
            id="promo-titulo"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej: Internet 200 Mbps por S/59.90..."
            className="h-11"
            required={!idProducto || idProducto === "null"}
          />
        </div>

        {/* Fecha Vencimiento */}
        <div className="space-y-2">
          <Label htmlFor="promo-fecha-vencimiento">Fecha de Vencimiento (Informativo, opcional)</Label>
          <Input
            id="promo-fecha-vencimiento"
            type="date"
            value={fechaVencimiento}
            onChange={(e) => setFechaVencimiento(e.target.value)}
            className="h-11"
          />
        </div>

        {/* Descripción */}
        <div className="space-y-2">
          <Label htmlFor="promo-desc">Descripción (opcional)</Label>
          <Textarea
            id="promo-desc"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Detalles de la promoción..."
            className="min-h-[100px] resize-y"
          />
        </div>

        {/* Imagen */}
        <div className="space-y-2">
          <Label>Imagen (opcional)</Label>
          {imagenUrl ? (
            <div className="relative rounded-xl overflow-hidden border border-border">
              <img src={imagenUrl} alt="Vista previa" className="w-full h-40 object-cover" />
              <button
                type="button"
                onClick={() => setImagenUrl("")}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-destructive/90 text-destructive-foreground flex items-center justify-center hover:bg-destructive transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-full h-28 rounded-xl border-2 border-dashed border-border hover:border-primary/40 bg-muted/30 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-colors cursor-pointer disabled:opacity-50"
            >
              {uploading ? <Loader2 size={24} className="animate-spin" /> : <ImagePlus size={24} />}
              <span className="text-xs">{uploading ? "Subiendo..." : "Subir imagen"}</span>
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </div>

        {/* ═══════════════════════════════════════════════════
            TERRITORIOS — Compact summary + "Editar" button
            ═══════════════════════════════════════════════════ */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <MapPin size={14} className="text-primary" />
            Ubicación
          </Label>

          <div
            className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20 hover:bg-muted/30 cursor-pointer transition-colors group"
            onClick={() => setSheetOpen(true)}
          >
            <div className="flex-1 min-w-0">
              {hasTerritory ? (
                <div className="space-y-1.5">
                  {todosDepartamentos ? (
                    <div className="flex items-center gap-2">
                      <Globe size={14} className="text-primary shrink-0" />
                      <span className="text-sm font-medium">Cobertura nacional</span>
                      <Badge variant="secondary" className="text-[10px]">Todos los deptos.</Badge>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-1.5">
                        {entries.filter(e => e.id_departamento).map((entry, i) => (
                          <Badge key={i} variant="outline" className="text-[10px] py-0.5 px-2 gap-1 font-normal">
                            <MapPin size={8} />
                            {entry.nombre_departamento}
                            {entry.todasProvincias && " (todas)"}
                            {!entry.todasProvincias && (() => {
                              const selected = entry.provinciaSelections.filter(
                                p => p.allDistricts || p.selectedDistricts.length > 0
                              );
                              if (selected.length > 0) {
                                return ` · ${selected.length} prov.`;
                              }
                              return "";
                            })()}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">{territorySummary}</p>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Sin territorios asignados — toca para configurar
                </p>
              )}
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity"
              onClick={(e) => { e.stopPropagation(); setSheetOpen(true); }}
            >
              <Pencil size={14} />
            </Button>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading || uploading}>
            {isLoading && <Loader2 size={16} className="animate-spin mr-2" />}
            {promocion ? "Guardar cambios" : "Crear promoción"}
          </Button>
        </div>
      </form>

      {/* Territory Sheet (lateral panel) */}
      <TerritorioSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        todosDepartamentos={todosDepartamentos}
        setTodosDepartamentos={setTodosDepartamentos}
        entries={entries}
        setEntries={setEntries}
        departamentos={departamentos}
      />
    </>
  );
};
