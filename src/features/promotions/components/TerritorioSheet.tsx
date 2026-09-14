import { useState, useEffect, useCallback } from "react";
import { MapPin, Globe, ChevronDown, ChevronRight, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { promotionsService } from "../services/promotions.service";
import type {
  Departamento,
  Provincia,
  Distrito,
} from "../types/promotions.types";

/* ─── Types ─── */

/** Selection state for a single province within a territory */
interface ProvinciaSelection {
  id: number;
  nombre: string;
  allDistricts: boolean;
  selectedDistricts: number[];
  // Cached district list (loaded lazily when expanded)
  distritos: Distrito[];
  loadedDistritos: boolean;
  expanded: boolean;
}

/** A single territory entry = one departamento with its province selections */
export interface TerritorioEntry {
  id_departamento: number | null;
  nombre_departamento: string;
  todasProvincias: boolean;
  provincias: Provincia[]; // all available provinces for this depto
  provinciaSelections: ProvinciaSelection[];
  expanded: boolean;
}

/** The payload format the backend expects per territory */
export interface TerritorioPayloadItem {
  id_departamento: number | null;
  id_provincia: number | null;
  id_distrito: number | null;
}

/* ─── Helpers ─── */

const emptyEntry = (): TerritorioEntry => ({
  id_departamento: null,
  nombre_departamento: "",
  todasProvincias: false,
  provincias: [],
  provinciaSelections: [],
  expanded: true,
});

/** Build the flat payload array from the tree state */
export const buildTerritorioPayload = (
  todosDepartamentos: boolean,
  entries: TerritorioEntry[]
): TerritorioPayloadItem[] => {
  if (todosDepartamentos) {
    return [{ id_departamento: null, id_provincia: null, id_distrito: null }];
  }

  const payload: TerritorioPayloadItem[] = [];

  for (const entry of entries) {
    if (!entry.id_departamento) continue;

    if (entry.todasProvincias) {
      payload.push({ id_departamento: entry.id_departamento, id_provincia: null, id_distrito: null });
      continue;
    }

    for (const prov of entry.provinciaSelections) {
      if (prov.allDistricts) {
        payload.push({ id_departamento: entry.id_departamento, id_provincia: prov.id, id_distrito: null });
      } else if (prov.selectedDistricts.length > 0) {
        for (const distId of prov.selectedDistricts) {
          payload.push({ id_departamento: entry.id_departamento, id_provincia: prov.id, id_distrito: distId });
        }
      }
    }

    // If no provinces are selected at all, add just the department
    const hasAnyProvSelection = entry.provinciaSelections.some(
      (p) => p.allDistricts || p.selectedDistricts.length > 0
    );
    if (!hasAnyProvSelection && !entry.todasProvincias) {
      payload.push({ id_departamento: entry.id_departamento, id_provincia: null, id_distrito: null });
    }
  }

  return payload;
};

/** Build a human-readable summary */
export const buildTerritorioSummary = (
  todosDepartamentos: boolean,
  entries: TerritorioEntry[]
): string => {
  if (todosDepartamentos) return "Cobertura nacional (todos los departamentos)";

  const parts: string[] = [];
  for (const entry of entries) {
    if (!entry.id_departamento) continue;
    if (entry.todasProvincias) {
      parts.push(`${entry.nombre_departamento} (todas las prov.)`);
      continue;
    }
    const provParts: string[] = [];
    for (const prov of entry.provinciaSelections) {
      if (prov.allDistricts) {
        provParts.push(`${prov.nombre} (todos)`);
      } else if (prov.selectedDistricts.length > 0) {
        provParts.push(`${prov.nombre} (${prov.selectedDistricts.length} dist.)`);
      }
    }
    if (provParts.length > 0) {
      parts.push(`${entry.nombre_departamento}: ${provParts.join(", ")}`);
    }
  }
  return parts.length > 0 ? parts.join(" · ") : "Sin territorios asignados";
};

/* ─── Component Props ─── */

interface TerritorioSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  todosDepartamentos: boolean;
  setTodosDepartamentos: (v: boolean) => void;
  entries: TerritorioEntry[];
  setEntries: (entries: TerritorioEntry[]) => void;
  departamentos: Departamento[];
}

/* ─── Component ─── */

export const TerritorioSheet = ({
  open,
  onOpenChange,
  todosDepartamentos,
  setTodosDepartamentos,
  entries,
  setEntries,
  departamentos,
}: TerritorioSheetProps) => {

  /* ─── Entry-level handlers ─── */

  const updateEntry = useCallback((index: number, changes: Partial<TerritorioEntry>) => {
    setEntries(entries.map((e, i) => (i === index ? { ...e, ...changes } : e)));
  }, [entries, setEntries]);

  const handleDeptoChange = useCallback(async (index: number, deptoId: string) => {
    const id = parseInt(deptoId);
    const depto = departamentos.find((d) => d.id === id);
    let provincias: Provincia[] = [];
    try {
      provincias = await promotionsService.getProvincias(id);
    } catch { /* empty */ }

    const newEntry: TerritorioEntry = {
      id_departamento: id,
      nombre_departamento: depto?.nombre ?? "",
      todasProvincias: false,
      provincias,
      provinciaSelections: provincias.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        allDistricts: false,
        selectedDistricts: [],
        distritos: [],
        loadedDistritos: false,
        expanded: false,
      })),
      expanded: true,
    };

    setEntries(entries.map((e, i) => (i === index ? newEntry : e)));
  }, [departamentos, entries, setEntries]);

  const addEntry = useCallback(() => {
    // Collapse all existing entries, only the new one is expanded
    const collapsed = entries.map((e) => ({ ...e, expanded: false }));
    setEntries([...collapsed, emptyEntry()]);
  }, [entries, setEntries]);

  const removeEntry = useCallback((index: number) => {
    if (entries.length <= 1) return;
    setEntries(entries.filter((_, i) => i !== index));
  }, [entries, setEntries]);

  const toggleEntryExpanded = useCallback((index: number) => {
    // Accordion: collapse all others, toggle the clicked one
    const isExpanding = !entries[index].expanded;
    setEntries(entries.map((e, i) => ({
      ...e,
      expanded: i === index ? isExpanding : false,
    })));
  }, [entries, setEntries]);

  /* ─── Province-level handlers ─── */

  const updateProvSelection = useCallback((entryIdx: number, provId: number, changes: Partial<ProvinciaSelection>) => {
    const entry = entries[entryIdx];
    const updated = entry.provinciaSelections.map((ps) =>
      ps.id === provId ? { ...ps, ...changes } : ps
    );
    updateEntry(entryIdx, { provinciaSelections: updated });
  }, [entries, updateEntry]);

  const toggleProvExpanded = useCallback(async (entryIdx: number, provId: number) => {
    const entry = entries[entryIdx];
    const prov = entry.provinciaSelections.find((p) => p.id === provId);
    if (!prov) return;

    // Lazy-load districts on first expand
    if (!prov.loadedDistritos && !prov.expanded) {
      let distritos: Distrito[] = [];
      try {
        distritos = await promotionsService.getDistritos(provId);
      } catch { /* empty */ }
      updateProvSelection(entryIdx, provId, {
        expanded: true,
        distritos,
        loadedDistritos: true,
      });
    } else {
      updateProvSelection(entryIdx, provId, { expanded: !prov.expanded });
    }
  }, [entries, updateProvSelection]);

  const toggleProvChecked = useCallback(async (entryIdx: number, provId: number, checked: boolean) => {
    const prov = entries[entryIdx].provinciaSelections.find((p) => p.id === provId);
    if (!prov) return;

    if (checked) {
      // Load districts if needed so we know names for summary
      if (!prov.loadedDistritos) {
        let distritos: Distrito[] = [];
        try { distritos = await promotionsService.getDistritos(provId); } catch { /* empty */ }
        updateProvSelection(entryIdx, provId, {
          allDistricts: true,
          selectedDistricts: [],
          distritos,
          loadedDistritos: true,
        });
      } else {
        updateProvSelection(entryIdx, provId, { allDistricts: true, selectedDistricts: [] });
      }
      // Uncheck "todas las provincias" if a specific one is being toggled
      if (entries[entryIdx].todasProvincias) {
        updateEntry(entryIdx, { todasProvincias: false });
      }
    } else {
      updateProvSelection(entryIdx, provId, { allDistricts: false, selectedDistricts: [] });
    }
  }, [entries, updateEntry, updateProvSelection]);

  /* ─── District-level handlers ─── */

  const toggleDistChecked = useCallback((entryIdx: number, provId: number, distId: number, checked: boolean) => {
    const prov = entries[entryIdx].provinciaSelections.find((p) => p.id === provId);
    if (!prov) return;

    let updated: number[];
    if (checked) {
      updated = [...prov.selectedDistricts, distId];
    } else {
      updated = prov.selectedDistricts.filter((id) => id !== distId);
    }

    updateProvSelection(entryIdx, provId, {
      selectedDistricts: updated,
      allDistricts: false,
    });
  }, [entries, updateProvSelection]);

  /* ─── "Todas las provincias" handler ─── */

  const toggleTodasProvincias = useCallback((entryIdx: number, checked: boolean) => {
    const entry = entries[entryIdx];
    if (checked) {
      // Clear all province-level selections
      const clearedProvs = entry.provinciaSelections.map((ps) => ({
        ...ps,
        allDistricts: false,
        selectedDistricts: [] as number[],
        expanded: false,
      }));
      updateEntry(entryIdx, { todasProvincias: true, provinciaSelections: clearedProvs });
    } else {
      updateEntry(entryIdx, { todasProvincias: false });
    }
  }, [entries, updateEntry]);

  /* ─── Compute selected count per province (for indeterminate state) ─── */

  const getProvCheckState = (prov: ProvinciaSelection): "checked" | "unchecked" | "indeterminate" => {
    if (prov.allDistricts) return "checked";
    if (prov.selectedDistricts.length === 0) return "unchecked";
    if (prov.loadedDistritos && prov.distritos.length > 0 && prov.selectedDistricts.length === prov.distritos.length) return "checked";
    return "indeterminate";
  };

  /* ─── Render ─── */

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <MapPin size={18} className="text-primary" />
            Ubicación / Territorios
          </SheetTitle>
          <SheetDescription>
            Selecciona dónde aplica esta promoción.
          </SheetDescription>
        </SheetHeader>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto -mx-4">
          <div className="px-4 space-y-3 pb-4">

            {/* "Todos los departamentos" master checkbox */}
            <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
              <Checkbox
                id="sheet-todos-deptos"
                checked={todosDepartamentos}
                onCheckedChange={(checked) => setTodosDepartamentos(checked === true)}
              />
              <label htmlFor="sheet-todos-deptos" className="flex items-center gap-2 text-sm font-medium cursor-pointer select-none">
                <Globe size={14} className="text-primary" />
                Todos los departamentos
              </label>
              {todosDepartamentos && (
                <Badge variant="secondary" className="ml-auto text-[10px]">Nacional</Badge>
              )}
            </div>

            {/* Territory entries */}
            {!todosDepartamentos && (
              <div className="space-y-2">
                {entries.map((entry, entryIdx) => (
                  <div
                    key={entryIdx}
                    className="rounded-xl border border-border bg-card overflow-hidden"
                  >
                    {/* Entry header */}
                    <div
                      className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/40 transition-colors"
                      onClick={() => toggleEntryExpanded(entryIdx)}
                    >
                      <MapPin size={13} className="text-primary shrink-0" />
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex-1">
                        Territorio{entries.length > 1 ? ` ${entryIdx + 1}` : ""}
                        {entry.nombre_departamento && !entry.expanded && (
                          <span className="normal-case tracking-normal font-normal ml-2 text-foreground">
                            — {entry.nombre_departamento}
                          </span>
                        )}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        {entries.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); removeEntry(entryIdx); }}
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 size={12} />
                          </Button>
                        )}
                        {entry.expanded ? (
                          <ChevronDown size={14} className="text-muted-foreground" />
                        ) : (
                          <ChevronRight size={14} className="text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {/* Expanded entry content */}
                    {entry.expanded && (
                      <div className="px-3 pb-3 space-y-3 border-t border-border/50">
                        {/* Depto select */}
                        <div className="space-y-1.5 pt-2.5">
                          <label className="text-xs font-medium text-muted-foreground">Departamento</label>
                          <Select
                            value={entry.id_departamento?.toString() ?? ""}
                            onValueChange={(v) => handleDeptoChange(entryIdx, v)}
                          >
                            <SelectTrigger className="h-9 text-sm">
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

                        {/* Province tree */}
                        {entry.id_departamento && entry.provincias.length > 0 && (
                          <div className="space-y-1.5 animate-in fade-in duration-200">
                            <label className="text-xs font-medium text-muted-foreground">Provincias y Distritos</label>

                            <div className="rounded-lg border border-border overflow-hidden">
                              {/* "Todas las provincias" */}
                              <div className="flex items-center gap-3 px-3 py-2 border-b border-border bg-muted/30">
                                <Checkbox
                                  id={`todas-prov-${entryIdx}`}
                                  checked={entry.todasProvincias}
                                  onCheckedChange={(checked) => toggleTodasProvincias(entryIdx, checked === true)}
                                />
                                <label htmlFor={`todas-prov-${entryIdx}`} className="text-sm font-semibold cursor-pointer select-none flex-1">
                                  Todas las provincias
                                </label>
                              </div>

                              {/* Province list */}
                              <div className="divide-y divide-border/40">
                                {entry.provinciaSelections.map((prov) => {
                                  const checkState = getProvCheckState(prov);
                                  const disabled = entry.todasProvincias;

                                  return (
                                    <div key={prov.id}>
                                      {/* Province row */}
                                      <div className={`flex items-center gap-2.5 px-3 py-2 transition-colors ${disabled ? "opacity-50" : "hover:bg-muted/30"}`}>
                                        <Checkbox
                                          id={`prov-${entryIdx}-${prov.id}`}
                                          checked={checkState === "checked" || checkState === "indeterminate"}
                                          disabled={disabled}
                                          onCheckedChange={(checked) => toggleProvChecked(entryIdx, prov.id, checked === true)}
                                          className={checkState === "indeterminate" ? "data-[state=checked]:bg-primary/60" : ""}
                                        />
                                        <button
                                          type="button"
                                          onClick={() => !disabled && toggleProvExpanded(entryIdx, prov.id)}
                                          className="flex items-center gap-1.5 flex-1 text-left disabled:opacity-50"
                                          disabled={disabled}
                                        >
                                          {prov.expanded ? (
                                            <ChevronDown size={12} className="text-muted-foreground shrink-0" />
                                          ) : (
                                            <ChevronRight size={12} className="text-muted-foreground shrink-0" />
                                          )}
                                          <span className="text-sm">{prov.nombre}</span>
                                          {checkState !== "unchecked" && !prov.allDistricts && prov.selectedDistricts.length > 0 && (
                                            <Badge variant="secondary" className="text-[9px] py-0 px-1.5 ml-auto">
                                              {prov.selectedDistricts.length} dist.
                                            </Badge>
                                          )}
                                          {prov.allDistricts && (
                                            <Badge variant="secondary" className="text-[9px] py-0 px-1.5 ml-auto">
                                              todos
                                            </Badge>
                                          )}
                                        </button>
                                      </div>

                                      {/* District list (expanded) */}
                                      {prov.expanded && !disabled && (
                                        <div className="bg-muted/10 border-t border-border/30 animate-in fade-in slide-in-from-top-1 duration-150">
                                          {!prov.loadedDistritos ? (
                                            <div className="px-6 py-3 text-center text-xs text-muted-foreground">
                                              <Loader2 size={12} className="animate-spin inline mr-1.5" />
                                              Cargando distritos...
                                            </div>
                                          ) : prov.distritos.length === 0 ? (
                                            <div className="px-6 py-3 text-center text-xs text-muted-foreground italic">
                                              Sin distritos disponibles
                                            </div>
                                          ) : (
                                            <div className="py-1">
                                              {/* Select all districts shortcut */}
                                              <div className="flex items-center gap-3 px-6 py-1.5">
                                                <Checkbox
                                                  id={`all-dist-${entryIdx}-${prov.id}`}
                                                  checked={prov.allDistricts}
                                                  onCheckedChange={(checked) => toggleProvChecked(entryIdx, prov.id, checked === true)}
                                                />
                                                <label
                                                  htmlFor={`all-dist-${entryIdx}-${prov.id}`}
                                                  className="text-xs font-semibold cursor-pointer select-none text-muted-foreground"
                                                >
                                                  Seleccionar todos
                                                </label>
                                              </div>

                                              {prov.distritos.map((dist) => {
                                                const isChecked = prov.allDistricts || prov.selectedDistricts.includes(dist.id);
                                                return (
                                                  <div key={dist.id} className="flex items-center gap-3 px-6 py-1.5 hover:bg-muted/30 transition-colors">
                                                    <Checkbox
                                                      id={`dist-${entryIdx}-${prov.id}-${dist.id}`}
                                                      checked={isChecked}
                                                      disabled={prov.allDistricts}
                                                      onCheckedChange={(checked) => toggleDistChecked(entryIdx, prov.id, dist.id, checked === true)}
                                                    />
                                                    <label
                                                      htmlFor={`dist-${entryIdx}-${prov.id}-${dist.id}`}
                                                      className={`text-xs cursor-pointer select-none flex-1 ${prov.allDistricts ? "text-muted-foreground" : ""}`}
                                                    >
                                                      {dist.nombre}
                                                    </label>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* Add territory button */}
                <button
                  type="button"
                  onClick={addEntry}
                  className="w-full py-2.5 rounded-xl border-2 border-dashed border-border hover:border-primary/40 bg-transparent hover:bg-muted/20 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-all cursor-pointer"
                >
                  <Plus size={14} />
                  Agregar territorio
                </button>
              </div>
            )}
          </div>
        </div>

        <SheetFooter>
          <Button onClick={() => onOpenChange(false)} className="w-full">
            Confirmar selección
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
