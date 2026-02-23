import { useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2, ShieldAlert } from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  backofficeFormSchema,
  type BackofficeFormData,
} from "../schemas/saleSchema";

import type { BackofficePayload, CatalogItem, Sale } from "../types";

interface BackofficeFormProps {
  sale: Sale;
  sotStates: CatalogItem[];
  audioStates: CatalogItem[];
  onSave: (data: BackofficePayload) => Promise<boolean>;
  onClose: () => void;
}

export function BackofficeForm({
  sale,
  sotStates,
  audioStates,
  onSave,
  onClose,
}: BackofficeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const extractDate = (dateString?: string) =>
    dateString ? dateString.split("T")[0] : "";

  const form = useForm<BackofficeFormData>({
    resolver: zodResolver(backofficeFormSchema),
    defaultValues: {
      codigo_sec: sale.codigo_sec || "",
      codigo_sot: sale.codigo_sot || "",
      fecha_visita_programada: extractDate(sale.fecha_visita_programada),
      id_estado_sot: sale.id_estado_sot?.toString() || "",
      id_estado_audios: sale.id_estado_audios?.toString() || "",
      observacion_audios: sale.observacion_audios || "",
      fecha_real_inst: "",
      fecha_rechazo: "",
    },
  });

  const currentStateId = form.watch("id_estado_sot");
  const selectedStateObj = sotStates.find(
    (e) => e.id.toString() === currentStateId,
  );
  const isAttended = selectedStateObj?.codigo?.toUpperCase() === "ATENDIDO";
  const isRejected = selectedStateObj?.codigo?.toUpperCase() === "RECHAZADO";

  const currentAudioId = form.watch("id_estado_audios");
  const isAudioRejected =
    audioStates
      .find((e) => e.id.toString() === currentAudioId)
      ?.codigo?.toUpperCase() === "RECHAZADO";

  const onSubmit = async (data: BackofficeFormData) => {
    setIsSubmitting(true);

    const payload: any = { ...data };

    Object.keys(payload).forEach((key) => {
      if (payload[key] === "" || payload[key] === "0") delete payload[key];
    });

    if (payload.id_estado_sot)
      payload.id_estado_sot = Number(payload.id_estado_sot);
    if (payload.id_estado_audios)
      payload.id_estado_audios = Number(payload.id_estado_audios);

    if (!isAttended) delete payload.fecha_real_inst;
    if (!isRejected && !isAudioRejected) delete payload.fecha_rechazo;

    try {
      const success = await onSave(payload as BackofficePayload);
      if (success) onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 pb-24 animate-in fade-in duration-300"
      >
        <Card className="p-4 bg-slate-50 border-slate-200">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-slate-900">
                {sale.cliente_nombre}
              </p>
              <p className="text-xs text-slate-500">
                DNI: {sale.cliente_numero_doc} | Asesor: {sale.nombre_asesor}
              </p>
              <p className="text-xs font-semibold text-primary mt-1">
                Plan: {sale.nombre_producto} ({sale.tecnologia})
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-5 space-y-4 border-blue-100 shadow-sm">
          <h3 className="font-bold text-xs text-blue-800 uppercase tracking-wider border-b border-blue-100 pb-2">
            Códigos de Instalación
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="codigo_sec"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código SEC</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: SEC-123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="codigo_sot"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código SOT</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: SOT-456" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fecha_visita_programada"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Fecha Agenda SOT</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Card>

        {/* DICTAMEN FINAL */}
        <Card className="p-5 space-y-4 border-slate-200 shadow-sm">
          <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider border-b pb-2">
            Dictamen Final
          </h3>

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="id_estado_audios"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Auditoría de Audios</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Estado de audios" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {audioStates.map((e) => (
                        <SelectItem key={e.id} value={e.id.toString()}>
                          {e.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isAudioRejected && (
              <FormField
                control={form.control}
                name="observacion_audios"
                render={({ field }) => (
                  <FormItem className="animate-in fade-in duration-200">
                    <FormLabel className="text-red-600">
                      Motivo de Rechazo (Audio)
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        className="border-red-200"
                        placeholder="Especifique el error del audio..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="id_estado_sot"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado Operativo SOT</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="border-blue-300 focus:ring-blue-500 bg-blue-50/30">
                        <SelectValue placeholder="Actualizar Estado..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {sotStates.map((e) => (
                        <SelectItem key={e.id} value={e.id.toString()}>
                          {e.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isAttended && (
              <FormField
                control={form.control}
                name="fecha_real_inst"
                render={({ field }) => (
                  <FormItem className="p-3 bg-green-50 border border-green-200 rounded-lg animate-in fade-in zoom-in-95 duration-200">
                    <FormLabel className="text-green-800">
                      Fecha Real de Instalación
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        className="border-green-300"
                        {...field}
                        required
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {(isRejected || isAudioRejected) && (
              <FormField
                control={form.control}
                name="fecha_rechazo"
                render={({ field }) => (
                  <FormItem className="p-3 bg-red-50 border border-red-200 rounded-lg animate-in fade-in zoom-in-95 duration-200">
                    <FormLabel className="text-red-800">
                      Fecha de Caída/Rechazo
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        className="border-red-300"
                        {...field}
                        required
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        </Card>

        {/* CONTROLES */}
        <div className="flex gap-3 p-4 bg-white/80 backdrop-blur-md border-t fixed bottom-0 right-0 left-0 sm:absolute sm:bottom-0 sm:left-0 sm:right-0 z-50">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-md"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              "Registrar Gestión"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
