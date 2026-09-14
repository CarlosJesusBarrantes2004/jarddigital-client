import { useState, useRef, useEffect } from "react";
import { ImagePlus, X, Loader2, Plus, Trash2, MapPin, ChevronDown, ChevronUp, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Provincia,
  Distrito,
} from "../types/promotions.types";

/* ─── Territorio panel state (replaces old TerritorioRow) ─── */
interface TerritorioPanel {
  id_departamento: number | null;
  nombre_departamento: string;
  id_provincia: number | null;
  nombre_provincia: string;
  todasProvincias: boolean;
  todosDistritos: boolean;
  distritosSeleccionados: number[];
  // Cached options
  provincias: Provincia[];
  distritos: Distrito[];
  // UI state
  expanded: boolean;
}

const emptyPanel = (): TerritorioPanel => ({
  id_departamento: null,
  nombre_departamento: "",
  id_provincia: null,
  nombre_provincia: "",
  todasProvincias: false,
  todosDistritos: false,
  distritosSeleccionados: [],
  provincias: [],
  distritos: [],
  expanded: true,
});

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

  // New territory state
  const [todosDepartamentos, setTodosDepartamentos] = useState(false);
  const [paneles, setPaneles] = useState<TerritorioPanel[]>([emptyPanel()]);

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
        // Check if it's a "todos los departamentos" case (null depto, null prov, null dist)
        const hasTodosDeptos = promocion.territorios.some(
          (t) => !t.id_departamento && !t.id_provincia && !t.id_distrito
        );
        if (hasTodosDeptos) {
          setTodosDepartamentos(true);
          setPaneles([emptyPanel()]);
          return;
        }

        // Group territories by departamento+provincia combo for panel reconstruction
        const grouped = new Map<string, typeof promocion.territorios>();
        for (const t of promocion.territorios) {
          const key = `${t.id_departamento ?? "null"}-${t.id_provincia ?? "null"}`;
          if (!grouped.has(key)) grouped.set(key, []);
          grouped.get(key)!.push(t);
        }

        const newPanels: TerritorioPanel[] = await Promise.all(
          Array.from(grouped.values()).map(async (terrs) => {
            const first = terrs[0];
            let provincias: Provincia[] = [];
            let distritos: Distrito[] = [];

            if (first.id_departamento) {
              provincias = await promotionsService.getProvincias(first.id_departamento).catch(() => []);
            }
            if (first.id_provincia) {
              distritos = await promotionsService.getDistritos(first.id_provincia).catch(() => []);
            }

            const deptoName = first.nombre_departamento ?? departamentos.find(d => d.id === first.id_departamento)?.nombre ?? "";
            const provName = first.nombre_provincia ?? provincias.find(p => p.id === first.id_provincia)?.nombre ?? "";

            // Is "todas las provincias"? (has depto but no provincia/distrito)
            const todasProvs = terrs.length === 1 && first.id_departamento && !first.id_provincia && !first.id_distrito;
            // Is "todos los distritos"? (has depto+prov but no distrito)
            const todosDists = terrs.length === 1 && first.id_provincia && !first.id_distrito;
            // Individual districts
            const distIds = terrs.filter(t => t.id_distrito).map(t => t.id_distrito!);

            return {
              id_departamento: first.id_departamento,
              nombre_departamento: deptoName,
              id_provincia: first.id_provincia,
              nombre_provincia: provName,
              todasProvincias: !!todasProvs,
              todosDistritos: !!todosDists,
              distritosSeleccionados: distIds,
              provincias,
              distritos,
              expanded: false, // collapsed by default when editing
            };
          })
        );

        setPaneles(newPanels);
      } else {
        setTodosDepartamentos(false);
        setPaneles([emptyPanel()]);
      }
    };
    loadTerritorios();
  }, [promocion, departamentos]);

  /* ─── Territory handlers ─── */

  const updatePanel = (index: number, changes: Partial<TerritorioPanel>) => {
    setPaneles((prev) => prev.map((p, i) => (i === index ? { ...p, ...changes } : p)));
  };

  const handleDepChange = async (index: number, depId: string) => {
    const id = parseInt(depId);
    const depto = departamentos.find((d) => d.id === id);
    let provincias: Provincia[] = [];
    try {
      provincias = await promotionsService.getProvincias(id);
    } catch { /* empty */ }

    updatePanel(index, {
      id_departamento: id,
      nombre_departamento: depto?.nombre ?? "",
      id_provincia: null,
      nombre_provincia: "",
      todasProvincias: false,
      todosDistritos: false,
      distritosSeleccionados: [],
      provincias,
      distritos: [],
    });
  };

  const handleProvChange = async (index: number, provId: string) => {
    if (provId === "all") {
      updatePanel(index, {
        id_provincia: null,
        nombre_provincia: "",
        todasProvincias: true,
        todosDistritos: false,
        distritosSeleccionados: [],
        distritos: [],
      });
    } else {
      const id = parseInt(provId);
      const panel = paneles[index];
      const prov = panel.provincias.find((p) => p.id === id);
      let distritos: Distrito[] = [];
      try {
        distritos = await promotionsService.getDistritos(id);
      } catch { /* empty */ }

      updatePanel(index, {
        id_provincia: id,
        nombre_provincia: prov?.nombre ?? "",
        todasProvincias: false,
        todosDistritos: false,
        distritosSeleccionados: [],
        distritos,
      });
    }
  };

  const handleDistToggle = (index: number, distId: number, checked: boolean) => {
    const panel = paneles[index];
    let updated: number[];
    if (checked) {
      updated = [...panel.distritosSeleccionados, distId];
    } else {
      updated = panel.distritosSeleccionados.filter((id) => id !== distId);
    }
    updatePanel(index, { distritosSeleccionados: updated, todosDistritos: false });
  };

  const handleTodosDistritosToggle = (index: number, checked: boolean) => {
    if (checked) {
      updatePanel(index, { todosDistritos: true, distritosSeleccionados: [] });
    } else {
      updatePanel(index, { todosDistritos: false });
    }
  };

  const addPanel = () => {
    setPaneles([...paneles, emptyPanel()]);
  };

  const removePanel = (index: number) => {
    if (paneles.length <= 1) return;
    setPaneles(paneles.filter((_, i) => i !== index));
  };

  const toggleExpanded = (index: number) => {
    updatePanel(index, { expanded: !paneles[index].expanded });
  };

  /* ─── Build summary text for collapsed panel ─── */
  const buildSummary = (panel: TerritorioPanel) => {
    if (!panel.id_departamento) return null;
    const parts: string[] = [panel.nombre_departamento];
    if (panel.todasProvincias) {
      parts.push("Todas las provincias");
    } else if (panel.id_provincia) {
      parts.push(panel.nombre_provincia);
      if (panel.todosDistritos) {
        parts.push("Todos los distritos");
      } else if (panel.distritosSeleccionados.length > 0) {
        const names = panel.distritosSeleccionados
          .map((id) => panel.distritos.find((d) => d.id === id)?.nombre)
          .filter(Boolean);
        parts.push(`${names.length} distrito${names.length !== 1 ? "s" : ""}`);
      }
    }
    return parts;
  };

  const getDistrictNames = (panel: TerritorioPanel) => {
    return panel.distritosSeleccionados
      .map((id) => panel.distritos.find((d) => d.id === id)?.nombre)
      .filter(Boolean) as string[];
  };

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

  /* ─── Submit: build same payload structure ─── */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() && !idProducto) {
      alert("Debe ingresar un título o seleccionar un producto.");
      return;
    }

    let terrPayload: { id_departamento: number | null; id_provincia: number | null; id_distrito: number | null }[] = [];

    if (todosDepartamentos) {
      // Global coverage — same as the old "all" behavior
      terrPayload = [{ id_departamento: null, id_provincia: null, id_distrito: null }];
    } else {
      for (const panel of paneles) {
        if (!panel.id_departamento) continue;

        if (panel.todasProvincias) {
          // Entire department
          terrPayload.push({ id_departamento: panel.id_departamento, id_provincia: null, id_distrito: null });
        } else if (panel.id_provincia && panel.todosDistritos) {
          // Entire province
          terrPayload.push({ id_departamento: panel.id_departamento, id_provincia: panel.id_provincia, id_distrito: null });
        } else if (panel.id_provincia && panel.distritosSeleccionados.length > 0) {
          // Individual districts
          for (const distId of panel.distritosSeleccionados) {
            terrPayload.push({ id_departamento: panel.id_departamento, id_provincia: panel.id_provincia, id_distrito: distId });
          }
        } else if (panel.id_provincia) {
          // Province selected but no districts → treat as entire province
          terrPayload.push({ id_departamento: panel.id_departamento, id_provincia: panel.id_provincia, id_distrito: null });
        } else {
          // Only department, no province → entire department
          terrPayload.push({ id_departamento: panel.id_departamento, id_provincia: null, id_distrito: null });
        }
      }
    }

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

      {/* ═══════════════════════════════════════════════════════════
          TERRITORIOS — Redesigned panel with checkboxes
          ═══════════════════════════════════════════════════════════ */}
      <div className="space-y-3">
        {/* Section header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-primary" />
            <Label className="text-sm font-semibold">Ubicación</Label>
          </div>
        </div>
        <p className="text-xs text-muted-foreground -mt-1">
          Selecciona dónde aplica esta promoción.
        </p>

        {/* "Todos los departamentos" master checkbox */}
        <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30 transition-colors">
          <Checkbox
            id="todos-deptos"
            checked={todosDepartamentos}
            onCheckedChange={(checked) => setTodosDepartamentos(checked === true)}
          />
          <label htmlFor="todos-deptos" className="flex items-center gap-2 text-sm font-medium cursor-pointer select-none">
            <Globe size={14} className="text-primary" />
            Todos los departamentos
          </label>
          {todosDepartamentos && (
            <Badge variant="secondary" className="ml-auto text-[10px]">Cobertura nacional</Badge>
          )}
        </div>

        {/* Territory panels */}
        {!todosDepartamentos && (
          <div className="space-y-2">
            {paneles.map((panel, idx) => {
              const summary = buildSummary(panel);
              const distNames = getDistrictNames(panel);

              return (
                <div
                  key={idx}
                  className="rounded-xl border border-border bg-card overflow-hidden transition-all"
                >
                  {/* Panel header — always visible */}
                  <div
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/40 transition-colors"
                    onClick={() => toggleExpanded(idx)}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <MapPin size={14} className="text-primary shrink-0" />
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Territorio {paneles.length > 1 ? idx + 1 : ""}
                      </span>

                      {/* Collapsed summary chips */}
                      {!panel.expanded && summary && (
                        <div className="flex items-center gap-1.5 ml-2 min-w-0 overflow-hidden">
                          {summary.map((part, i) => (
                            <span key={i} className="flex items-center gap-1 text-xs text-muted-foreground">
                              {i > 0 && <span className="text-muted-foreground/40">›</span>}
                              <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-normal whitespace-nowrap">
                                {part}
                              </Badge>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {paneles.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); removePanel(idx); }}
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 size={13} />
                        </Button>
                      )}
                      {panel.expanded ? (
                        <ChevronUp size={16} className="text-muted-foreground" />
                      ) : (
                        <ChevronDown size={16} className="text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* District summary badge (below header when collapsed) */}
                  {!panel.expanded && distNames.length > 0 && (
                    <div className="px-4 pb-3 -mt-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge className="text-[10px] py-0.5 px-2 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15">
                          {distNames.length} distrito{distNames.length !== 1 ? "s" : ""}: {distNames.join(", ")}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Expanded panel content */}
                  {panel.expanded && (
                    <div className="px-4 pb-4 space-y-4 border-t border-border/50">
                      {/* Departamento Select */}
                      <div className="space-y-1.5 pt-3">
                        <label className="text-xs font-medium text-muted-foreground">Departamento</label>
                        <Select
                          value={panel.id_departamento?.toString() ?? ""}
                          onValueChange={(v) => handleDepChange(idx, v)}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Selecciona un departamento" />
                          </SelectTrigger>
                          <SelectContent>
                            {departamentos.map((d) => (
                              <SelectItem key={d.id} value={d.id.toString()}>
                                {d.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Provincia Select */}
                      {panel.id_departamento && (
                        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                          <label className="text-xs font-medium text-muted-foreground">Provincia</label>
                          <Select
                            value={panel.todasProvincias ? "all" : (panel.id_provincia?.toString() ?? "")}
                            onValueChange={(v) => handleProvChange(idx, v)}
                          >
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Selecciona una provincia" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all" className="font-medium">
                                Todas las provincias
                              </SelectItem>
                              {panel.provincias.map((p) => (
                                <SelectItem key={p.id} value={p.id.toString()}>
                                  {p.nombre}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Distritos — Checkbox list */}
                      {panel.id_provincia && !panel.todasProvincias && (
                        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                          <label className="text-xs font-medium text-muted-foreground">Distritos</label>
                          <div className="rounded-lg border border-border overflow-hidden">
                            {/* "Todos los distritos" option */}
                            <div className="flex items-center gap-3 px-3 py-2.5 border-b border-border bg-muted/30">
                              <Checkbox
                                id={`todos-dist-${idx}`}
                                checked={panel.todosDistritos}
                                onCheckedChange={(checked) => handleTodosDistritosToggle(idx, checked === true)}
                              />
                              <label
                                htmlFor={`todos-dist-${idx}`}
                                className="text-sm font-semibold cursor-pointer select-none flex-1"
                              >
                                Todos los distritos
                              </label>
                            </div>

                            {/* Individual districts */}
                            <ScrollArea className="max-h-48">
                              <div className="divide-y divide-border/50">
                                {panel.distritos.map((dist) => {
                                  const isChecked = panel.todosDistritos || panel.distritosSeleccionados.includes(dist.id);
                                  return (
                                    <div
                                      key={dist.id}
                                      className="flex items-center gap-3 px-3 py-2 hover:bg-muted/30 transition-colors"
                                    >
                                      <Checkbox
                                        id={`dist-${idx}-${dist.id}`}
                                        checked={isChecked}
                                        disabled={panel.todosDistritos}
                                        onCheckedChange={(checked) => handleDistToggle(idx, dist.id, checked === true)}
                                      />
                                      <label
                                        htmlFor={`dist-${idx}-${dist.id}`}
                                        className={`text-sm cursor-pointer select-none flex-1 ${
                                          panel.todosDistritos ? "text-muted-foreground" : ""
                                        }`}
                                      >
                                        {dist.nombre}
                                      </label>
                                    </div>
                                  );
                                })}
                                {panel.distritos.length === 0 && (
                                  <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                                    <Loader2 size={14} className="animate-spin inline mr-2" />
                                    Cargando distritos...
                                  </div>
                                )}
                              </div>
                            </ScrollArea>
                          </div>

                          {/* Selected districts summary chip */}
                          {panel.distritosSeleccionados.length > 0 && !panel.todosDistritos && (
                            <div className="flex flex-wrap gap-1.5 pt-1 animate-in fade-in duration-200">
                              {getDistrictNames(panel).map((name) => (
                                <Badge
                                  key={name}
                                  variant="secondary"
                                  className="text-[10px] py-0.5 px-2 gap-1"
                                >
                                  <MapPin size={8} />
                                  {name}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* "Todas las provincias" confirmation badge */}
                      {panel.todasProvincias && (
                        <Badge variant="secondary" className="text-[10px] py-1 px-2.5 gap-1 animate-in fade-in duration-200">
                          <Globe size={10} />
                          Aplica a todas las provincias de {panel.nombre_departamento}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Add territory button */}
            <button
              type="button"
              onClick={addPanel}
              className="w-full py-3 rounded-xl border-2 border-dashed border-border hover:border-primary/40 bg-transparent hover:bg-muted/20 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-all cursor-pointer"
            >
              <Plus size={14} />
              Agregar territorio
            </button>
          </div>
        )}
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
  );
};
