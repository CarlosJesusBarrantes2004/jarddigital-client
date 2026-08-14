import { useState, useEffect } from "react";
import { Shield, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/api/axios";
import { cn } from "@/lib/utils";

import { useRoles } from "@/features/core/hooks/useRoles";

import { SECTIONS } from "@/components/sidebar";
import type { RoleCode } from "@/features/auth/types";

// Modules available in the sidebar
const AVAILABLE_MODULES = [
  "Operaciones",
  "Comercial",
  "Finanzas",
  "Capital Humano",
  "Configuración",
];

export const ModulesManager = () => {
  const { roles, loading: isLoadingRoles } = useRoles();
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [isFetchingModules, setIsFetchingModules] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch modules when a role is selected
  useEffect(() => {
    if (!selectedRoleId) {
      setSelectedModules([]);
      return;
    }

    const fetchModules = async () => {
      try {
        setIsFetchingModules(true);
        const { data } = await api.get<string[]>(`/users/roles/${selectedRoleId}/modulos/`);
        
        let initialModules = data;
        
        // Mapeamos los padres para asegurar compatibilidad hacia atrás: 
        // si un padre está en la BD, auto-agregamos todos sus hijos a initialModules
        const expandedModules = new Set(initialModules);
        SECTIONS.forEach((section) => {
          if (expandedModules.has(section.title)) {
            section.items.forEach((item) => expandedModules.add(item.label));
          }
        });
        initialModules = Array.from(expandedModules);

        if (initialModules.length === 0) {
          const roleCode = roles.find((r) => r.id === selectedRoleId)?.codigo as RoleCode;
          if (roleCode) {
            const modulesWithFallback: string[] = [];
            SECTIONS.forEach((section) => {
              const visibleItems = section.items.filter(
                (item) => item.roles.length === 0 || item.roles.includes(roleCode)
              );
              if (visibleItems.length > 0) {
                modulesWithFallback.push(section.title);
                visibleItems.forEach(item => modulesWithFallback.push(item.label));
              }
            });
            initialModules = modulesWithFallback;
          }
        }
        setSelectedModules(initialModules);
      } catch (error) {
        console.error("Error al obtener módulos", error);
        toast.error("Error al obtener los módulos del rol");
      } finally {
        setIsFetchingModules(false);
      }
    };

    fetchModules();
  }, [selectedRoleId, roles]);

  const toggleModule = (moduleName: string) => {
    setSelectedModules((prev) =>
      prev.includes(moduleName)
        ? prev.filter((m) => m !== moduleName)
        : [...prev, moduleName]
    );
  };

  const handleSave = async () => {
    if (!selectedRoleId) return;
    try {
      setIsSaving(true);
      await api.post(`/users/roles/${selectedRoleId}/modulos/`, {
        modulos: selectedModules,
      });
      toast.success("Módulos actualizados correctamente");
    } catch (error) {
      console.error("Error guardando módulos", error);
      toast.error("Error al guardar los módulos");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingRoles) {
    return (
      <div className="flex flex-col items-center justify-center py-20 opacity-50">
        <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
        <p className="text-sm">Cargando datos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Lado Izquierdo: Lista de Roles */}
        <div className="w-full md:w-1/3 space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-medium">1. Selecciona un Rol</h2>
          </div>
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            {roles.map((rol) => (
              <button
                key={rol.id}
                onClick={() => setSelectedRoleId(rol.id)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 text-left transition-colors border-b border-border/50 last:border-0",
                  selectedRoleId === rol.id
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted text-foreground"
                )}
              >
                <div className="flex flex-col">
                  <span className="text-[14px] font-medium leading-none">
                    {rol.nombre}
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-1 uppercase font-mono tracking-wider">
                    {rol.codigo}
                  </span>
                </div>
                {selectedRoleId === rol.id && <Check size={16} />}
              </button>
            ))}
          </div>
        </div>

        {/* Lado Derecho: Checklist de Módulos */}
        <div className="w-full md:w-2/3 space-y-3">
          <div className="flex items-center justify-between mb-4 h-7">
            <h2 className="text-lg font-medium flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/20 text-primary text-xs font-bold">
                2
              </span>
              Asigna Módulos
            </h2>
            {selectedRoleId && (
              <button
                onClick={handleSave}
                disabled={isSaving || isFetchingModules}
                className="h-8 px-4 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Guardar Cambios
              </button>
            )}
          </div>

          {!selectedRoleId ? (
            <div className="bg-muted/30 border border-dashed border-border/60 rounded-xl h-64 flex flex-col items-center justify-center text-muted-foreground">
              <Shield size={32} className="mb-3 opacity-20" />
              <p className="text-sm">Selecciona un rol a la izquierda para empezar</p>
            </div>
          ) : isFetchingModules ? (
            <div className="bg-card border border-border rounded-xl h-64 flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SECTIONS.map((section) => {
                const itemLabels = section.items.map((i) => i.label);
                
                // Determinamos estado del Padre
                const allChildrenSelected = itemLabels.every((label) =>
                  selectedModules.includes(label),
                );
                const someChildrenSelected = itemLabels.some((label) =>
                  selectedModules.includes(label),
                );
                const isParentSelected =
                  selectedModules.includes(section.title) || allChildrenSelected;
                const isIndeterminate =
                  someChildrenSelected && !isParentSelected;

                const toggleParent = () => {
                  setSelectedModules((prev) => {
                    if (isParentSelected) {
                      // Desmarcar padre y todos los hijos
                      return prev.filter(
                        (m) => m !== section.title && !itemLabels.includes(m),
                      );
                    } else {
                      // Marcar padre y todos los hijos
                      const newSet = new Set([
                        ...prev,
                        section.title,
                        ...itemLabels,
                      ]);
                      return Array.from(newSet);
                    }
                  });
                };

                const toggleChild = (childLabel: string) => {
                  setSelectedModules((prev) => {
                    let next = [...prev];
                    if (next.includes(childLabel)) {
                      next = next.filter((m) => m !== childLabel);
                      next = next.filter((m) => m !== section.title); // Desmarcar padre explícito
                    } else {
                      next.push(childLabel);
                      // Auto-marcar padre si todos los hijos están marcados
                      const nowAllSelected = itemLabels.every((label) =>
                        next.includes(label),
                      );
                      if (nowAllSelected && !next.includes(section.title)) {
                        next.push(section.title);
                      }
                    }
                    return next;
                  });
                };

                return (
                  <div
                    key={section.title}
                    className="bg-card border border-border rounded-xl overflow-hidden shadow-sm flex flex-col"
                  >
                    {/* Encabezado del Módulo (Padre) */}
                    <div
                      className={cn(
                        "flex items-center gap-3 p-4 border-b border-border/50 transition-colors",
                        isParentSelected
                          ? "bg-primary/5"
                          : "bg-background",
                      )}
                    >
                      <button
                        onClick={toggleParent}
                        className={cn(
                          "w-5 h-5 rounded flex items-center justify-center shrink-0 border transition-colors",
                          isParentSelected
                            ? "bg-primary border-primary text-primary-foreground"
                            : isIndeterminate
                            ? "bg-primary/50 border-primary/50 text-white"
                            : "bg-transparent border-muted-foreground/30 hover:border-primary/50",
                        )}
                      >
                        {isParentSelected && <Check size={14} strokeWidth={3} />}
                        {isIndeterminate && (
                          <div className="w-2.5 h-0.5 bg-white rounded-full" />
                        )}
                      </button>
                      <div className="flex items-center gap-2 flex-1 cursor-default">
                        <section.Icon
                          size={16}
                          className={cn(
                            "shrink-0",
                            isParentSelected || isIndeterminate
                              ? "text-primary"
                              : "text-muted-foreground",
                          )}
                        />
                        <span className="text-[14px] font-semibold tracking-wide">
                          {section.title}
                        </span>
                      </div>
                    </div>

                    {/* Lista de Submódulos (Hijos) */}
                    <div className="flex flex-col p-2 bg-muted/10 flex-1">
                      {section.items.map((item) => {
                        const isChildSelected = selectedModules.includes(
                          item.label,
                        );
                        return (
                          <button
                            key={item.label}
                            onClick={() => toggleChild(item.label)}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                              isChildSelected
                                ? "text-foreground"
                                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                            )}
                          >
                            <div
                              className={cn(
                                "w-4 h-4 rounded-full flex items-center justify-center shrink-0 border transition-colors",
                                isChildSelected
                                  ? "bg-primary border-primary text-primary-foreground"
                                  : "bg-transparent border-muted-foreground/30",
                              )}
                            >
                              {isChildSelected && (
                                <Check size={10} strokeWidth={3} />
                              )}
                            </div>
                            <span className="text-[13px] font-medium leading-none">
                              {item.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
