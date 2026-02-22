import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { Venta, BackofficePayload, CatalogoItem } from "../types";

interface Props {
  venta: Venta;
  estadosSOT: CatalogoItem[];
  estadosAudio: CatalogoItem[]; // Opcional, pero útil si necesitas forzar el CONFORME
  onSave: (data: BackofficePayload) => Promise<boolean>;
  onClose: () => void;
}

export function BackofficeForm({
  venta,
  estadosSOT,
  estadosAudio,
  onSave,
  onClose,
}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper para sacar solo la fecha "YYYY-MM-DD" si viene con hora "YYYY-MM-DDTHH:MM:SSZ"
  const extractDate = (dateString?: string) =>
    dateString ? dateString.split("T")[0] : "";

  const [formData, setFormData] = useState<BackofficePayload>({
    codigo_sec: venta.codigo_sec || "",
    codigo_sot: venta.codigo_sot || "",
    fecha_visita_programada: venta.fecha_visita_programada || "",
    id_estado_sot: venta.id_estado_sot || 0,
    fecha_real_inst: extractDate(venta.fecha_real_inst),
    fecha_rechazo: extractDate(venta.fecha_rechazo),
  });

  // Identificamos qué código de estado SOT se ha seleccionado actualmente en el combo
  const selectedEstadoObj = estadosSOT.find(
    (e) => e.id === formData.id_estado_sot,
  );
  const codigoEstadoActual = selectedEstadoObj?.codigo?.toUpperCase(); // 'ATENDIDO', 'RECHAZADO', etc.

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Limpiamos datos vacíos para no enviar strings vacíos donde Django espera Null
    const payload: any = { ...formData };

    // Limpieza dinámica
    Object.keys(payload).forEach((key) => {
      if (payload[key] === "" || payload[key] === 0) {
        delete payload[key];
      }
    });

    // Si no es ATENDIDO, no enviamos fecha de instalación para no ensuciar BD
    if (codigoEstadoActual !== "ATENDIDO") delete payload.fecha_real_inst;
    // Si no es RECHAZADO, no enviamos fecha de rechazo
    if (codigoEstadoActual !== "RECHAZADO") delete payload.fecha_rechazo;

    const success = await onSave(payload);
    setIsSubmitting(false);
    if (success) onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="p-4 space-y-3 bg-slate-50 border-slate-200">
        <h3 className="font-semibold text-sm text-slate-700 uppercase tracking-wide">
          Resumen Venta
        </h3>
        <p className="text-sm">
          <strong>Cliente:</strong> {venta.cliente_nombre} - DNI{" "}
          {venta.cliente_numero_doc}
        </p>
        <p className="text-sm">
          <strong>Asesor:</strong> {venta.nombre_asesor}
        </p>
      </Card>

      <Card className="p-4 space-y-4">
        <h3 className="font-semibold text-sm text-primary uppercase">
          Gestión Operativa
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Código SEC</label>
              <Input
                value={formData.codigo_sec}
                onChange={(e) =>
                  setFormData({ ...formData, codigo_sec: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Código SOT</label>
              <Input
                value={formData.codigo_sot}
                onChange={(e) =>
                  setFormData({ ...formData, codigo_sot: e.target.value })
                }
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">
              Fecha Visita Programada
            </label>
            <Input
              type="date"
              value={formData.fecha_visita_programada}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  fecha_visita_programada: e.target.value,
                })
              }
              className="mt-1"
            />
          </div>

          <div className="border-t pt-4">
            <label className="text-sm font-medium text-blue-700">
              Estado SOT Actual
            </label>
            <Select
              onValueChange={(val) =>
                setFormData({ ...formData, id_estado_sot: Number(val) })
              }
              value={formData.id_estado_sot?.toString()}
            >
              <SelectTrigger className="mt-1 border-blue-300 focus:ring-blue-500">
                <SelectValue placeholder="Actualizar Estado..." />
              </SelectTrigger>
              <SelectContent>
                {estadosSOT.map((e) => (
                  <SelectItem key={e.id} value={e.id.toString()}>
                    {e.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* RENDERIZADO CONDICIONAL DE REGLAS DE NEGOCIO */}
          {codigoEstadoActual === "ATENDIDO" && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg animate-in fade-in zoom-in duration-300">
              <label className="text-sm font-medium text-green-800">
                Fecha Real de Instalación (Obligatorio)
              </label>
              <Input
                type="date"
                required
                value={formData.fecha_real_inst}
                onChange={(e) =>
                  setFormData({ ...formData, fecha_real_inst: e.target.value })
                }
                className="mt-1 border-green-300"
              />
            </div>
          )}

          {codigoEstadoActual === "RECHAZADO" && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg animate-in fade-in zoom-in duration-300">
              <label className="text-sm font-medium text-red-800">
                Fecha de Rechazo (Obligatorio)
              </label>
              <Input
                type="date"
                required
                value={formData.fecha_rechazo}
                onChange={(e) =>
                  setFormData({ ...formData, fecha_rechazo: e.target.value })
                }
                className="mt-1 border-red-300"
              />
            </div>
          )}
        </div>
      </Card>

      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            "Guardar Cambios"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
          className="flex-1"
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
