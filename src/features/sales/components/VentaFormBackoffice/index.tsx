import { useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Loader2,
  Lock,
  AlertTriangle,
  Info,
  Play,
  CheckCircle2,
  XCircle,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import {
  updateVentaBackofficeSchema,
  type UpdateVentaBackofficeValues,
} from "../../schemas/venta.schema";
import {
  useUpdateVenta,
  useEstadosSOT,
  useSubEstadosSOT,
  useEstadosAudio,
} from "../../hooks/useSales";
import type { Venta, AudioVenta } from "../../types/sales.types";
import { EstadoBadge } from "../EstadoBadge";

// ── Campo solo lectura con candado ────────────────────────────────────────────
function Campo({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <div className="flex min-h-9 items-center gap-2 rounded-md border border-zinc-100 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
        <Lock className="h-3 w-3 shrink-0 text-zinc-300" />
        <span>{value || <span className="text-zinc-400 italic">—</span>}</span>
      </div>
    </div>
  );
}

// ── Reproductor de audio inline ───────────────────────────────────────────────
function AudioItem({ audio, index }: { audio: AudioVenta; index: number }) {
  const conforme = audio.conforme;
  return (
    <div
      className={cn(
        "rounded-lg border p-3 transition-colors",
        conforme === true
          ? "border-emerald-200 bg-emerald-50/50"
          : conforme === false
            ? "border-red-200 bg-red-50/50"
            : "border-zinc-200 bg-white",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-bold text-zinc-600">
            {index + 1}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-zinc-700">
              {audio.nombre_etiqueta}
            </p>
            {audio.motivo && (
              <p className="text-xs text-red-600 mt-0.5">Obs: {audio.motivo}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {conforme === true && (
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          )}
          {conforme === false && <XCircle className="h-4 w-4 text-red-500" />}
          {conforme === null && <Volume2 className="h-4 w-4 text-zinc-400" />}
          <a
            href={audio.url_audio}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 transition-colors"
          >
            <Play className="h-3 w-3" />
            Escuchar
          </a>
        </div>
      </div>
      {/* Mini reproductor nativo como fallback */}
      <audio
        controls
        src={audio.url_audio}
        className="mt-2 h-8 w-full"
        preload="none"
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

interface VentaFormBackofficeProps {
  open: boolean;
  onClose: () => void;
  venta: Venta;
}

export function VentaFormBackoffice({
  open,
  onClose,
  venta,
}: VentaFormBackofficeProps) {
  const { mutateAsync: actualizarVenta, isPending } = useUpdateVenta(venta.id);
  const { data: estadosSOT = [] } = useEstadosSOT();
  const { data: subEstados = [] } = useSubEstadosSOT();
  const { data: estadosAudio = [] } = useEstadosAudio();

  const estadoActualCodigo = venta.codigo_estado?.toUpperCase() ?? "";
  const estaEnEjecucion = estadoActualCodigo === "EJECUCION";
  const estaEnAtendido = estadoActualCodigo === "ATENDIDO";
  const estaRechazado = estadoActualCodigo === "RECHAZADO";
  // Es reingresada si el backend registró una venta_origen
  const esReingresada = !!venta.venta_origen;

  // Como el componente recibe key={venta.id} desde el padre,
  // se remonta limpio cada vez que cambia la venta.
  // defaultValues se aplican correctamente al montar.
  const form = useForm<UpdateVentaBackofficeValues>({
    resolver: zodResolver(updateVentaBackofficeSchema),
    defaultValues: {
      // Si es reingreso, pre-cargamos los códigos de la venta origen para que backoffice los vea
      codigo_sec: venta.codigo_sec ?? venta.codigo_sec_origen ?? "",
      codigo_sot: venta.codigo_sot ?? venta.codigo_sot_origen ?? "",
      fecha_visita_programada: venta.fecha_visita_programada ?? "",
      bloque_horario: venta.bloque_horario ?? "",
      id_sub_estado_sot: venta.id_sub_estado_sot ?? undefined,
      id_estado_sot: venta.id_estado_sot ?? undefined,
      fecha_real_inst: venta.fecha_real_inst?.split("T")[0] ?? "",
      fecha_rechazo: venta.fecha_rechazo?.split("T")[0] ?? "",
      comentario_gestion: venta.comentario_gestion ?? "",
      id_estado_audios: venta.id_estado_audios ?? undefined,
      observacion_audios: venta.observacion_audios ?? "",
      _codigo_estado_destino: estadoActualCodigo,
    },
  });

  const estadoSotSeleccionadoId = form.watch("id_estado_sot");
  const estadoDestino = estadosSOT.find(
    (e) => e.id === estadoSotSeleccionadoId,
  );
  const codigoEstadoDestino = estadoDestino?.codigo?.toUpperCase() ?? "";
  const esRechazando = codigoEstadoDestino === "RECHAZADO";
  const esAtendiendo = codigoEstadoDestino === "ATENDIDO";

  useEffect(() => {
    form.setValue("_codigo_estado_destino", codigoEstadoDestino);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codigoEstadoDestino]);

  const onSubmit = async (values: UpdateVentaBackofficeValues) => {
    try {
      const payload: Record<string, unknown> = {};
      if (values.codigo_sec !== undefined)
        payload.codigo_sec = values.codigo_sec;
      if (values.codigo_sot !== undefined)
        payload.codigo_sot = values.codigo_sot;
      if (values.fecha_visita_programada)
        payload.fecha_visita_programada = values.fecha_visita_programada;
      if (values.bloque_horario) payload.bloque_horario = values.bloque_horario;
      if (values.id_sub_estado_sot !== undefined)
        payload.id_sub_estado_sot = values.id_sub_estado_sot;
      if (values.id_estado_sot !== undefined)
        payload.id_estado_sot = values.id_estado_sot;
      if (values.fecha_real_inst)
        payload.fecha_real_inst = values.fecha_real_inst;
      if (values.fecha_rechazo) payload.fecha_rechazo = values.fecha_rechazo;
      if (values.comentario_gestion !== undefined)
        payload.comentario_gestion = values.comentario_gestion;
      if (values.id_estado_audios !== undefined)
        payload.id_estado_audios = values.id_estado_audios;
      if (values.observacion_audios !== undefined)
        payload.observacion_audios = values.observacion_audios;

      await actualizarVenta(payload as never);
      toast.success("Venta actualizada correctamente");
      onClose();
    } catch (error: unknown) {
      const err = error as { response?: { data?: Record<string, unknown> } };
      if (err?.response?.data) {
        const errores = err.response.data;
        const primerError = Object.values(errores)[0];
        toast.error(
          Array.isArray(primerError) ? primerError[0] : String(primerError),
        );
      } else {
        toast.error("Error al actualizar la venta");
      }
    }
  };

  const estadoColorHex =
    estadosSOT.find((e) => e.id === venta.id_estado_sot)?.color_hex ??
    "#6b7280";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-hidden p-0">
        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <DialogHeader className="border-b border-zinc-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">
              Venta #{venta.id}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {esReingresada && (
                <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                  Reingresada
                </Badge>
              )}
              <EstadoBadge
                estado={
                  venta.codigo_estado
                    ? {
                        nombre: venta.nombre_estado ?? venta.codigo_estado,
                        codigo: venta.codigo_estado,
                        color_hex: estadoColorHex,
                      }
                    : null
                }
              />
            </div>
          </div>

          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-zinc-500">
            <span>
              Asesor:{" "}
              <span className="font-medium text-zinc-700">
                {venta.nombre_asesor}
              </span>
            </span>
            <span>
              Supervisor:{" "}
              <span className="font-medium text-zinc-700">
                {venta.nombre_supervisor}
              </span>
            </span>
            {venta.fecha_venta && (
              <span>
                Fecha venta:{" "}
                <span className="font-medium text-zinc-700">
                  {new Date(venta.fecha_venta).toLocaleDateString("es-PE")}
                </span>
              </span>
            )}
          </div>

          {/* Info reingreso */}
          {esReingresada && (
            <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50 p-2.5">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <div className="text-xs text-amber-700 space-y-0.5">
                <p>
                  <span className="font-semibold">
                    ⚠️ Reingreso de venta #{venta.venta_origen}.
                  </span>
                </p>
                <p>
                  Los códigos SEC/SOT de la gestión anterior están pre-cargados.
                  Puedes mantenerlos o cambiarlos.
                </p>
                {(venta.codigo_sec_origen || venta.codigo_sot_origen) && (
                  <p className="font-mono">
                    {venta.codigo_sec_origen && (
                      <span>SEC anterior: {venta.codigo_sec_origen} </span>
                    )}
                    {venta.codigo_sot_origen && (
                      <span>SOT anterior: {venta.codigo_sot_origen}</span>
                    )}
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogHeader>

        {/* ── TABS: Gestión / Datos cliente / Audios ─────────────────────── */}
        <div className="max-h-[calc(92vh-160px)] overflow-y-auto">
          <Tabs defaultValue="gestion" className="w-full">
            <TabsList className="mx-6 mt-4 grid w-[calc(100%-3rem)] grid-cols-3">
              <TabsTrigger value="gestion">Gestión</TabsTrigger>
              <TabsTrigger value="cliente">Datos del Cliente</TabsTrigger>
              <TabsTrigger value="audios">
                Audios
                {venta.audios?.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1.5 h-5 px-1.5 text-xs"
                  >
                    {venta.audios.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* ══ TAB GESTIÓN ══════════════════════════════════════════════ */}
            <TabsContent value="gestion" className="px-6 pb-6 pt-4">
              <FormProvider {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  {/* Alerta RECHAZADO */}
                  {estaRechazado && (
                    <div className="flex items-start gap-3 rounded-lg border border-red-100 bg-red-50 p-4">
                      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                      <div>
                        <p className="font-medium text-red-700">
                          Venta Rechazada — Cerrada definitivamente
                        </p>
                        {venta.comentario_gestion && (
                          <p className="mt-1 text-sm text-red-600">
                            <span className="font-medium">Motivo:</span>{" "}
                            {venta.comentario_gestion}
                          </p>
                        )}
                        {venta.fecha_rechazo && (
                          <p className="text-sm text-red-600">
                            <span className="font-medium">Fecha:</span>{" "}
                            {new Date(venta.fecha_rechazo).toLocaleDateString(
                              "es-PE",
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ATENDIDO — solo lectura */}
                  {estaEnAtendido && (
                    <div className="flex items-start gap-3 rounded-lg border border-emerald-100 bg-emerald-50 p-4">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                      <div>
                        <p className="font-medium text-emerald-700">
                          Instalación completada
                        </p>
                        <p className="text-sm text-emerald-600">
                          Fecha:{" "}
                          {venta.fecha_real_inst
                            ? new Date(
                                venta.fecha_real_inst,
                              ).toLocaleDateString("es-PE")
                            : "—"}
                        </p>
                      </div>
                    </div>
                  )}

                  {!estaRechazado && !estaEnAtendido && (
                    <>
                      {/* CÓDIGOS SEC / SOT */}
                      <div>
                        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
                          Códigos de Operación
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="codigo_sec"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Código SEC</FormLabel>
                                <FormControl>
                                  <Input placeholder="SEC-XXXXXX" {...field} />
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
                                  <Input placeholder="SOT-XXXXXX" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        {!estaEnEjecucion && (
                          <p className="mt-1.5 flex items-center gap-1 text-xs text-blue-600">
                            <Info className="h-3 w-3" />
                            Al guardar ambos códigos la venta pasa
                            automáticamente a EJECUCIÓN
                          </p>
                        )}
                      </div>

                      <Separator />

                      {/* AGENDA */}
                      <div>
                        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
                          Agenda
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="fecha_visita_programada"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Fecha de visita programada
                                </FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="bloque_horario"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Bloque horario</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value ?? ""}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecciona..." />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="MAÑANA">
                                      Mañana (8am–12pm)
                                    </SelectItem>
                                    <SelectItem value="TARDE">
                                      Tarde (12pm–6pm)
                                    </SelectItem>
                                    <SelectItem value="NOCHE">
                                      Noche (6pm–10pm)
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* Sub-estado (solo si EJECUCION) */}
                      {estaEnEjecucion && (
                        <>
                          <Separator />
                          <div>
                            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
                              Sub-Estado
                            </h3>
                            <FormField
                              control={form.control}
                              name="id_sub_estado_sot"
                              render={({ field }) => (
                                <FormItem className="max-w-xs">
                                  <FormLabel>Sub-estado SOT</FormLabel>
                                  <Select
                                    onValueChange={(v) =>
                                      field.onChange(Number(v))
                                    }
                                    value={
                                      field.value
                                        ? String(field.value)
                                        : undefined
                                    }
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Selecciona..." />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {subEstados.map((se) => (
                                        <SelectItem
                                          key={se.id}
                                          value={String(se.id)}
                                        >
                                          <span className="flex items-center gap-2">
                                            <span
                                              className="h-2 w-2 rounded-full"
                                              style={{
                                                backgroundColor: se.color_hex,
                                              }}
                                            />
                                            {se.nombre}
                                          </span>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </>
                      )}

                      <Separator />

                      {/* CAMBIO DE ESTADO */}
                      <div>
                        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
                          Cambio de Estado
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="id_estado_sot"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Estado SOT</FormLabel>
                                <Select
                                  onValueChange={(v) =>
                                    field.onChange(Number(v))
                                  }
                                  value={
                                    field.value
                                      ? String(field.value)
                                      : undefined
                                  }
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecciona..." />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {estadosSOT.map((e) => (
                                      <SelectItem
                                        key={e.id}
                                        value={String(e.id)}
                                      >
                                        <span className="flex items-center gap-2">
                                          <span
                                            className="h-2 w-2 rounded-full"
                                            style={{
                                              backgroundColor: e.color_hex,
                                            }}
                                          />
                                          {e.nombre}
                                        </span>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {esAtendiendo && (
                            <FormField
                              control={form.control}
                              name="fecha_real_inst"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    Fecha real de instalación{" "}
                                    <span className="text-red-500">*</span>
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      type="date"
                                      {...field}
                                      value={field.value ?? ""}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}

                          {esRechazando && (
                            <FormField
                              control={form.control}
                              name="fecha_rechazo"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    Fecha de rechazo{" "}
                                    <span className="text-red-500">*</span>
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      type="date"
                                      {...field}
                                      value={field.value ?? ""}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                        </div>

                        {esRechazando && (
                          <div className="mt-4">
                            <FormField
                              control={form.control}
                              name="comentario_gestion"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    Comentario de gestión{" "}
                                    <span className="text-red-500">*</span>
                                  </FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Motivo del rechazo — el asesor verá este mensaje..."
                                      rows={3}
                                      {...field}
                                      value={field.value ?? ""}
                                      className="border-red-200 bg-red-50 focus:border-red-400"
                                    />
                                  </FormControl>
                                  <FormDescription className="text-xs text-red-500">
                                    Obligatorio. Explica el motivo claramente.
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        )}
                      </div>

                      <Separator />

                      {/* AUDIOS */}
                      <div>
                        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
                          Estado de Audios
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="id_estado_audios"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Estado</FormLabel>
                                <Select
                                  onValueChange={(v) =>
                                    field.onChange(Number(v))
                                  }
                                  value={
                                    field.value
                                      ? String(field.value)
                                      : undefined
                                  }
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecciona..." />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {estadosAudio.map((ea) => (
                                      <SelectItem
                                        key={ea.id}
                                        value={String(ea.id)}
                                      >
                                        {ea.nombre}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="mt-3">
                          <FormField
                            control={form.control}
                            name="observacion_audios"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Observación de audios</FormLabel>
                                <FormControl>
                                  <Textarea
                                    rows={2}
                                    {...field}
                                    value={field.value ?? ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Footer */}
                  <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={onClose}>
                      {estaRechazado || estaEnAtendido ? "Cerrar" : "Cancelar"}
                    </Button>
                    {!estaRechazado && !estaEnAtendido && (
                      <Button type="submit" disabled={isPending}>
                        {isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Guardando...
                          </>
                        ) : (
                          "Guardar Cambios"
                        )}
                      </Button>
                    )}
                  </div>
                </form>
              </FormProvider>
            </TabsContent>

            {/* ══ TAB DATOS DEL CLIENTE ════════════════════════════════════ */}
            <TabsContent value="cliente" className="px-6 pb-6 pt-4">
              <div className="space-y-6">
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
                    <Lock className="h-3.5 w-3.5" /> Datos personales
                  </h3>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <Campo
                      label="Nombre / Razón social"
                      value={venta.cliente_nombre}
                    />
                    <Campo
                      label="N° Documento"
                      value={venta.cliente_numero_doc}
                    />
                    <Campo label="Teléfono" value={venta.cliente_telefono} />
                    <Campo label="Email" value={venta.cliente_email} />
                    <Campo
                      label="Apellido paterno"
                      value={venta.cliente_papa}
                    />
                    <Campo
                      label="Apellido materno"
                      value={venta.cliente_mama}
                    />
                    <Campo
                      label="Fecha de nacimiento"
                      value={
                        venta.cliente_fecha_nacimiento
                          ? new Date(
                              venta.cliente_fecha_nacimiento,
                            ).toLocaleDateString("es-PE")
                          : undefined
                      }
                    />
                    <Campo
                      label="N° Instalación"
                      value={venta.numero_instalacion}
                    />
                    <Campo label="Tipo venta" value={venta.tipo_venta} />
                  </div>
                </div>

                {(venta.representante_legal_dni ||
                  venta.representante_legal_nombre) && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-amber-500">
                        Representante Legal
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        <Campo
                          label="DNI del representante"
                          value={venta.representante_legal_dni}
                        />
                        <Campo
                          label="Nombre del representante"
                          value={venta.representante_legal_nombre}
                        />
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
                    <Lock className="h-3.5 w-3.5" /> Instalación
                  </h3>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <Campo label="Plan" value={venta.nombre_producto} />
                    <Campo label="Tecnología" value={venta.tecnologia} />
                    <Campo
                      label="Full Claro"
                      value={venta.es_full_claro ? "Sí" : "No"}
                    />
                    <Campo label="Dirección" value={venta.direccion_detalle} />
                    <Campo label="Plano" value={venta.plano} />
                    <Campo
                      label="Score crediticio"
                      value={venta.score_crediticio}
                    />
                    <Campo
                      label="Coordenadas GPS"
                      value={venta.coordenadas_gps}
                    />
                    <Campo label="Referencias" value={venta.referencias} />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ══ TAB AUDIOS ═══════════════════════════════════════════════ */}
            <TabsContent value="audios" className="px-6 pb-6 pt-4">
              {!venta.audios || venta.audios.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-zinc-400">
                  <Volume2 className="h-10 w-10" />
                  <p className="text-sm">
                    No hay audios registrados en esta venta
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm text-zinc-500">
                      {venta.audios.length} audio(s) registrados
                    </p>
                    {venta.id_estado_audios && (
                      <Badge variant="outline" className="text-xs">
                        Estado audios:{" "}
                        {estadosAudio.find(
                          (e) => e.id === venta.id_estado_audios,
                        )?.nombre ?? "—"}
                      </Badge>
                    )}
                  </div>
                  {venta.audios.map((audio, idx) => (
                    <AudioItem
                      key={audio.id ?? idx}
                      audio={audio}
                      index={idx}
                    />
                  ))}
                  {venta.observacion_audios && (
                    <div className="mt-3 rounded-lg border border-amber-100 bg-amber-50 p-3">
                      <p className="text-xs font-medium text-amber-700">
                        Observación de audios:
                      </p>
                      <p className="mt-1 text-sm text-amber-800">
                        {venta.observacion_audios}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
