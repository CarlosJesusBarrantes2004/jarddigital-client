import { useState, useEffect, useCallback } from "react";
import {
  Settings,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

import {
  getReglasComision,
  createReglaComision,
  updateReglaComision, // <-- Ahora lo usaremos
  deleteReglaComision,
  type ReglaComision,
  type ReglaComisionPayload,
  extraerErrorFinanzas,
} from "../services/finances.api";
import { toast } from "sonner";

export const ReglasComisionPage = () => {
  const [reglas, setReglas] = useState<ReglaComision[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados del Formulario Modal
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // NUEVO ESTADO: Para saber qué regla estamos editando. Si es null, estamos creando.
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState<ReglaComisionPayload>({
    periodo_inicio: "",
    escenario: "ESTANDAR",
    min_ventas_pagadas_medio: 7,
    min_ventas_pagadas_optimo: 10,
    alto_valor_nivel_1: 2,
    alto_valor_nivel_2: 3,
    alto_valor_nivel_3: 4,
    sueldo_base_elite: "1130.00",
    activo: true,
  });

  const fetchReglas = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getReglasComision();
      setReglas(data.results);
    } catch (error) {
      toast.error("No se pudieron cargar las reglas");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReglas();
  }, [fetchReglas]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingId) {
        // MODO EDICIÓN
        await updateReglaComision(editingId, formData);
        toast.success("Regla actualizada exitosamente");
      } else {
        // MODO CREACIÓN
        await createReglaComision(formData);
        toast.success("Regla creada exitosamente");
      }
      setShowModal(false);
      fetchReglas();
    } catch (error) {
      toast.error(extraerErrorFinanzas(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: number) => {
    toast("¿Eliminar esta regla?", {
      description:
        "Si eliminas una regla que ya fue usada en cálculos pasados, podrías causar problemas en reportes históricos.",
      duration: 8000,
      action: {
        label: "Sí, eliminar",
        onClick: async () => {
          const loadingId = toast.loading("Eliminando regla...");
          try {
            await deleteReglaComision(id);
            toast.success("La regla ha sido eliminada", { id: loadingId });
            fetchReglas();
          } catch (error) {
            toast.error(extraerErrorFinanzas(error), { id: loadingId });
          }
        },
      },
      cancel: {
        label: "Cancelar",
        onClick: () => toast.dismiss(),
      },
    });
  };

  const openNewModal = () => {
    setEditingId(null); // Limpiamos el ID porque es nuevo
    setFormData({
      periodo_inicio: "",
      escenario: "ESTANDAR",
      min_ventas_pagadas_medio: 7,
      min_ventas_pagadas_optimo: 10,
      alto_valor_nivel_1: 2,
      alto_valor_nivel_2: 3,
      alto_valor_nivel_3: 4,
      sueldo_base_elite: "1130.00",
      activo: true,
    });
    setShowModal(true);
  };

  // NUEVA FUNCIÓN: Para abrir el modal pre-llenado con los datos
  const openEditModal = (regla: ReglaComision) => {
    setEditingId(regla.id);
    setFormData({
      periodo_inicio: regla.periodo_inicio,
      escenario: regla.escenario,
      min_ventas_pagadas_medio: regla.min_ventas_pagadas_medio,
      min_ventas_pagadas_optimo: regla.min_ventas_pagadas_optimo,
      alto_valor_nivel_1: regla.alto_valor_nivel_1,
      alto_valor_nivel_2: regla.alto_valor_nivel_2,
      alto_valor_nivel_3: regla.alto_valor_nivel_3,
      sueldo_base_elite: regla.sueldo_base_elite.toString(),
      activo: regla.activo,
    });
    setShowModal(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6 animate-in fade-in duration-300">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Settings className="text-primary" />
            Reglas de Comisión
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configura los umbrales de ventas y multiplicadores para el cálculo
            mensual.
          </p>
        </div>
        <button
          onClick={openNewModal}
          className="h-10 px-4 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 flex items-center gap-2 transition-transform hover:-translate-y-0.5"
        >
          <Plus size={16} /> Nueva Regla
        </button>
      </div>

      {/* LISTADO DE REGLAS */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="p-10 text-center text-muted-foreground">
            Cargando configuraciones...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="px-4 py-3">Vigencia (Desde)</th>
                  <th className="px-4 py-3">Escenario</th>
                  <th className="px-4 py-3 text-center">
                    Metas (Medio / Óptimo)
                  </th>
                  <th className="px-4 py-3 text-center">
                    Alto Valor (90% / 100% / 110%)
                  </th>
                  <th className="px-4 py-3 text-center">Sueldo Élite</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reglas.map((regla) => (
                  <tr key={regla.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">
                      {regla.periodo_inicio}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "px-2 py-1 rounded-md text-[11px] font-bold tracking-wide",
                          regla.escenario === "ELITE"
                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                        )}
                      >
                        {regla.escenario}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {regla.min_ventas_pagadas_medio} /{" "}
                      {regla.min_ventas_pagadas_optimo}
                    </td>
                    <td className="px-4 py-3 text-center">
                      ≥ {regla.alto_valor_nivel_1} / ≥{" "}
                      {regla.alto_valor_nivel_2} / ≥ {regla.alto_valor_nivel_3}
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">
                      {regla.escenario === "ELITE"
                        ? `S/ ${regla.sueldo_base_elite}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {regla.activo ? (
                        <CheckCircle2
                          size={16}
                          className="text-green-500 mx-auto"
                        />
                      ) : (
                        <XCircle size={16} className="text-red-500 mx-auto" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {/* BOTONES DE EDICIÓN Y BORRADO */}
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(regla)}
                          className="p-1.5 text-muted-foreground hover:text-primary rounded-md transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(regla.id)}
                          className="p-1.5 text-muted-foreground hover:text-red-500 rounded-md transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL CREACIÓN / EDICIÓN */}
      {showModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-2xl rounded-xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-border bg-muted/30">
              <h2 className="text-lg font-semibold text-foreground">
                {editingId ? "Editar Regla" : "Crear Nueva Regla"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    Periodo de Inicio
                  </label>
                  <input
                    type="date"
                    required
                    name="periodo_inicio"
                    value={formData.periodo_inicio}
                    onChange={handleChange}
                    className="w-full h-9 px-3 bg-background border border-input rounded-md text-sm"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Ej: 01/06/2026
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    Escenario a Configurar
                  </label>
                  <select
                    name="escenario"
                    value={formData.escenario}
                    onChange={handleChange}
                    className="w-full h-9 px-3 bg-background border border-input rounded-md text-sm"
                  >
                    <option value="ESTANDAR">
                      ESTÁNDAR (&lt; 20 Instalaciones)
                    </option>
                    <option value="ELITE">ÉLITE (≥ 20 Instalaciones)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    Mínimo para cobrar 50%
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    name="min_ventas_pagadas_medio"
                    value={formData.min_ventas_pagadas_medio}
                    onChange={handleChange}
                    className="w-full h-9 px-3 bg-background border border-input rounded-md text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    Mínimo para cobrar 100%
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    name="min_ventas_pagadas_optimo"
                    value={formData.min_ventas_pagadas_optimo}
                    onChange={handleChange}
                    className="w-full h-9 px-3 bg-background border border-input rounded-md text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    AV para mantener 90%
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    name="alto_valor_nivel_1"
                    value={formData.alto_valor_nivel_1}
                    onChange={handleChange}
                    className="w-full h-9 px-3 bg-background border border-input rounded-md text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    AV para cobrar 100%
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    name="alto_valor_nivel_2"
                    value={formData.alto_valor_nivel_2}
                    onChange={handleChange}
                    className="w-full h-9 px-3 bg-background border border-input rounded-md text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    AV para cobrar 110% (Bono)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    name="alto_valor_nivel_3"
                    value={formData.alto_valor_nivel_3}
                    onChange={handleChange}
                    className="w-full h-9 px-3 bg-background border border-input rounded-md text-sm"
                  />
                </div>

                {formData.escenario === "ELITE" && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">
                      Sueldo Base Élite (S/)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      name="sueldo_base_elite"
                      value={formData.sueldo_base_elite}
                      onChange={handleChange}
                      className="w-full h-9 px-3 bg-background border border-input rounded-md text-sm border-yellow-500 focus:ring-yellow-500"
                    />
                  </div>
                )}

                {/* NUEVO CAMPO: Checkbox Activo/Inactivo (Para desactivar reglas en lugar de borrarlas) */}
                <div
                  className={cn(
                    "flex items-center gap-2 h-9 mt-auto",
                    formData.escenario === "ESTANDAR" && "md:col-start-2",
                  )}
                >
                  <input
                    type="checkbox"
                    id="activo"
                    name="activo"
                    checked={formData.activo}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label
                    htmlFor="activo"
                    className="text-sm font-medium text-foreground cursor-pointer"
                  >
                    Regla Activa
                  </label>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="h-9 px-4 text-sm font-medium border border-input rounded-md hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-9 px-4 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting
                    ? "Guardando..."
                    : editingId
                      ? "Actualizar Regla"
                      : "Guardar Regla"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
