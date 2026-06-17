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
  getModalidades,
  type ReglaComision,
  type ReglaComisionPayload,
  extraerErrorFinanzas,
} from "../services/finances.api";
import { toast } from "sonner";

export const ReglasComisionPage = () => {
  const [reglas, setReglas] = useState<ReglaComision[]>([]);
  const [modalidades, setModalidades] = useState<
    { id: number; codigo: string; nombre: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState<ReglaComisionPayload>({
    periodo_inicio: "",
    escenario: "ESTANDAR",
    id_modalidad: "" as unknown as number, // <-- NUEVO
    min_ventas_pagadas_medio: 7,
    min_ventas_pagadas_optimo: 10,
    alto_valor_nivel_1: 2,
    alto_valor_nivel_2: 3,
    alto_valor_nivel_3: 4,
    sueldo_base_elite: "1130.00",
    activo: true,
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [reglasData, modsData] = await Promise.all([
        getReglasComision(),
        getModalidades(),
      ]);
      setReglas(reglasData.results);
      setModalidades(modsData);
    } catch (error) {
      toast.error("Error al cargar configuración");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : name === "id_modalidad"
            ? Number(value)
            : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id_modalidad)
      return toast.error("Debe seleccionar una modalidad");
    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateReglaComision(editingId, formData);
        toast.success("Regla actualizada exitosamente");
      } else {
        await createReglaComision(formData);
        toast.success("Regla creada exitosamente");
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      toast.error(extraerErrorFinanzas(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: number) => {
    toast("¿Eliminar regla?", {
      description: "Podrías causar problemas en reportes históricos.",
      action: {
        label: "Sí, eliminar",
        onClick: async () => {
          const loadingId = toast.loading("Eliminando...");
          try {
            await deleteReglaComision(id);
            toast.success("Eliminada", { id: loadingId });
            fetchData();
          } catch (error) {
            toast.error(extraerErrorFinanzas(error), { id: loadingId });
          }
        },
      },
      cancel: { label: "Cancelar", onClick: () => toast.dismiss() },
    });
  };

  const openNewModal = () => {
    setEditingId(null);
    setFormData({
      periodo_inicio: "",
      escenario: "ESTANDAR",
      id_modalidad: "" as unknown as number,
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

  const openEditModal = (regla: ReglaComision) => {
    setEditingId(regla.id);
    setFormData({
      periodo_inicio: regla.periodo_inicio,
      escenario: regla.escenario,
      id_modalidad: regla.id_modalidad,
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Settings className="text-primary" /> Reglas de Comisión
          </h1>
        </div>
        <button
          onClick={openNewModal}
          className="h-10 px-4 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 flex items-center gap-2"
        >
          <Plus size={16} /> Nueva Regla
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="p-10 text-center text-muted-foreground">
            Cargando...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="px-4 py-3">Vigencia (Desde)</th>
                  <th className="px-4 py-3">Canal</th>
                  <th className="px-4 py-3">Escenario</th>
                  <th className="px-4 py-3 text-center">
                    Metas (Medio/Óptimo)
                  </th>
                  <th className="px-4 py-3 text-center">
                    Alto Valor (90%/100%/110%)
                  </th>
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
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded-md text-[11px] font-bold">
                        {regla.codigo_modalidad}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "px-2 py-1 rounded-md text-[11px] font-bold",
                          regla.escenario === "ELITE"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-blue-100 text-blue-700",
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
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(regla)}
                          className="text-muted-foreground hover:text-primary"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(regla.id)}
                          className="text-muted-foreground hover:text-red-500"
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
                {/* ---> SE AÑADIÓ SELECT DE MODALIDAD <--- */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    Canal de Venta (Modalidad)
                  </label>
                  <select
                    name="id_modalidad"
                    required
                    value={formData.id_modalidad}
                    onChange={handleChange}
                    className="w-full h-9 px-3 bg-background border border-input rounded-md text-sm"
                  >
                    <option value="">Seleccione canal...</option>
                    {modalidades.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.codigo} - {m.nombre}
                      </option>
                    ))}
                  </select>
                </div>

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
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Escenario</label>
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
                  <label className="text-sm font-medium">Mín. para 50%</label>
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
                  <label className="text-sm font-medium">Mín. para 100%</label>
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
                  <label className="text-sm font-medium">AV para 90%</label>
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
                  <label className="text-sm font-medium">AV para 100%</label>
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
                    AV para 110% (Bono)
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
                <div className="flex items-center gap-2 h-9 mt-auto md:col-start-2">
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
                    className="text-sm font-medium cursor-pointer"
                  >
                    Regla Activa
                  </label>
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="h-9 px-4 border border-input rounded-md hover:bg-muted text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-9 px-4 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 disabled:opacity-50"
                >
                  {isSubmitting ? "Guardando..." : "Guardar Regla"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
