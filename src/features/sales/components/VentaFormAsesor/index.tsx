import { useState, useEffect, useCallback } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import {
  createVentaSchema,
  type CreateVentaFormValues,
} from "../../schemas/venta.schema";
import {
  useCreateVenta,
  useTiposDocumento,
  useDistritoById,
} from "../../hooks/useSales";
import type { Venta } from "../../types/sales.types";
import { StepDatosCliente } from "./StepDatosCliente";
import { StepUbicacion } from "./StepUbicacion";
import { StepAudios } from "./StepAudios";

const PASOS = [
  { label: "Datos del Cliente" },
  { label: "Instalación" },
  { label: "Audios" },
];

interface VentaFormAsesorProps {
  open: boolean;
  onClose: () => void;
  ventaOrigen?: Venta | null;
}

const EMPTY: Partial<CreateVentaFormValues> = {
  es_full_claro: false,
  audios: [],
  _codigo_tipo_doc: "",
  dep_nacimiento_id: null,
  prov_nacimiento_id: null,
  id_distrito_nacimiento: null,
  dep_instalacion_id: null,
  prov_instalacion_id: null,
};

export function VentaFormAsesor({
  open,
  onClose,
  ventaOrigen,
}: VentaFormAsesorProps) {
  const [paso, setPaso] = useState(0);
  const { mutateAsync: crearVenta, isPending } = useCreateVenta();
  const { data: tiposDoc = [] } = useTiposDocumento();

  // Resolvemos padres ubigeo. Las queries se lanzan en cuanto hay un ID,
  // incluso antes de abrir el modal — cuando lleguen, buildValues las usará.
  const { data: padresInst, isLoading: loadingInst } = useDistritoById(
    ventaOrigen?.id_distrito_instalacion ?? null,
  );
  const { data: padresNac, isLoading: loadingNac } = useDistritoById(
    ventaOrigen?.id_distrito_nacimiento ?? null,
  );

  const esReingreso = !!ventaOrigen;

  // Esperamos a que TODOS los datos async estén listos
  const cargandoUbigeo =
    esReingreso &&
    (loadingInst || (!!ventaOrigen?.id_distrito_nacimiento && loadingNac));

  const form = useForm<CreateVentaFormValues>({
    resolver: zodResolver(createVentaSchema),
    defaultValues: EMPTY as CreateVentaFormValues,
  });

  const buildValues = useCallback((): CreateVentaFormValues => {
    if (!ventaOrigen) return EMPTY as CreateVentaFormValues;

    const tipoDoc = tiposDoc.find(
      (t) => t.id === ventaOrigen.id_tipo_documento,
    );

    return {
      id_producto: ventaOrigen.id_producto,
      tecnologia: ventaOrigen.tecnologia,
      id_tipo_documento: ventaOrigen.id_tipo_documento,
      _codigo_tipo_doc: tipoDoc?.codigo ?? "",
      cliente_numero_doc: ventaOrigen.cliente_numero_doc,
      cliente_nombre: ventaOrigen.cliente_nombre,
      cliente_telefono: ventaOrigen.cliente_telefono,
      cliente_email: ventaOrigen.cliente_email ?? "",
      cliente_papa: ventaOrigen.cliente_papa,
      cliente_mama: ventaOrigen.cliente_mama,
      cliente_fecha_nacimiento:
        ventaOrigen.cliente_fecha_nacimiento?.split("T")[0] ?? "",
      numero_instalacion: ventaOrigen.numero_instalacion,
      representante_legal_dni: ventaOrigen.representante_legal_dni ?? "",
      representante_legal_nombre: ventaOrigen.representante_legal_nombre ?? "",

      // Ubigeo — con padres ya resueltos
      dep_instalacion_id: padresInst?.departamentoId ?? null,
      prov_instalacion_id: padresInst?.provinciaId ?? null,
      id_distrito_instalacion: ventaOrigen.id_distrito_instalacion,

      dep_nacimiento_id: padresNac?.departamentoId ?? null,
      prov_nacimiento_id: padresNac?.provinciaId ?? null,
      id_distrito_nacimiento: ventaOrigen.id_distrito_nacimiento ?? null,

      referencias: ventaOrigen.referencias ?? "",
      plano: ventaOrigen.plano,
      direccion_detalle: ventaOrigen.direccion_detalle,
      coordenadas_gps: ventaOrigen.coordenadas_gps ?? "",
      es_full_claro: ventaOrigen.es_full_claro,
      score_crediticio: ventaOrigen.score_crediticio ?? "",
      id_grabador_audios: ventaOrigen.id_grabador_audios,

      // Audios: copiamos solo etiqueta+url (el resto lo pone el backend)
      audios: (ventaOrigen.audios ?? []).map((a) => ({
        nombre_etiqueta: a.nombre_etiqueta,
        url_audio: a.url_audio,
      })),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ventaOrigen?.id, padresInst, padresNac, tiposDoc.length]);

  // Reset cuando: abre el modal Y los datos ubigeo ya llegaron
  useEffect(() => {
    if (!open) return;
    if (cargandoUbigeo) return;
    form.reset(buildValues());
    setPaso(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, cargandoUbigeo]);

  const irSiguiente = async () => {
    let campos: (keyof CreateVentaFormValues)[] = [];
    if (paso === 0) {
      campos = [
        "id_producto",
        "tecnologia",
        "id_tipo_documento",
        "cliente_numero_doc",
        "cliente_nombre",
        "cliente_papa",
        "cliente_mama",
        "cliente_telefono",
        "cliente_email",
        "cliente_fecha_nacimiento",
        "numero_instalacion",
      ];
    } else if (paso === 1) {
      campos = [
        "dep_instalacion_id",
        "prov_instalacion_id",
        "id_distrito_instalacion",
        "plano",
        "direccion_detalle",
        "coordenadas_gps",
        "score_crediticio",
      ];
    }
    const ok = await form.trigger(campos);
    if (ok) setPaso((p) => p + 1);
  };

  const onSubmit = async (values: CreateVentaFormValues) => {
    try {
      await crearVenta({
        id_producto: values.id_producto,
        tecnologia: values.tecnologia,
        id_tipo_documento: values.id_tipo_documento,
        cliente_numero_doc: values.cliente_numero_doc,
        cliente_nombre: values.cliente_nombre,
        cliente_telefono: values.cliente_telefono,
        cliente_email: values.cliente_email,
        id_distrito_nacimiento: values.id_distrito_nacimiento ?? null,
        cliente_papa: values.cliente_papa,
        cliente_mama: values.cliente_mama,
        numero_instalacion: values.numero_instalacion,
        cliente_fecha_nacimiento: values.cliente_fecha_nacimiento,
        representante_legal_dni: values.representante_legal_dni || null,
        representante_legal_nombre: values.representante_legal_nombre || null,
        id_distrito_instalacion: values.id_distrito_instalacion,
        referencias: values.referencias ?? "",
        plano: values.plano,
        direccion_detalle: values.direccion_detalle,
        coordenadas_gps: values.coordenadas_gps,
        es_full_claro: values.es_full_claro,
        score_crediticio: values.score_crediticio,
        id_grabador_audios: values.id_grabador_audios,
        audios: values.audios,
        // Pasamos la referencia a la venta rechazada para que el backend la registre
        ...(esReingreso && ventaOrigen ? { venta_origen: ventaOrigen.id } : {}),
      });
      toast.success(
        esReingreso
          ? "Venta reingresada exitosamente"
          : "Venta registrada exitosamente",
      );
      handleClose();
    } catch (error: unknown) {
      const err = error as { response?: { data?: Record<string, unknown> } };
      if (err?.response?.data) {
        const errores = err.response.data;
        const primerError = Object.values(errores)[0];
        toast.error(
          Array.isArray(primerError) ? primerError[0] : String(primerError),
        );
      } else {
        toast.error("Error al registrar la venta");
      }
    }
  };

  const handleClose = () => {
    form.reset(EMPTY as CreateVentaFormValues);
    setPaso(0);
    onClose();
  };

  const mostrarLoader = esReingreso && cargandoUbigeo;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-hidden p-0">
        {/* ── HEADER ── */}
        <DialogHeader className="border-b border-zinc-100 px-6 py-4">
          <DialogTitle className="text-lg font-semibold">
            {esReingreso ? (
              <span>
                Reingresar Venta{" "}
                <span className="ml-1 rounded bg-amber-100 px-2 py-0.5 text-sm text-amber-700">
                  Basada en #{ventaOrigen?.id}
                </span>
              </span>
            ) : (
              "Nueva Venta"
            )}
          </DialogTitle>

          {!mostrarLoader && (
            <div className="mt-3 flex items-center">
              {PASOS.map((p, idx) => (
                <div key={idx} className="flex items-center">
                  <button
                    type="button"
                    onClick={() => idx < paso && setPaso(idx)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors",
                      idx === paso
                        ? "bg-zinc-900 text-white"
                        : idx < paso
                          ? "cursor-pointer text-zinc-600 hover:bg-zinc-100"
                          : "cursor-not-allowed text-zinc-300",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold",
                        idx === paso
                          ? "bg-white text-zinc-900"
                          : idx < paso
                            ? "bg-emerald-500 text-white"
                            : "bg-zinc-200 text-zinc-400",
                      )}
                    >
                      {idx < paso ? <Check className="h-3 w-3" /> : idx + 1}
                    </span>
                    {p.label}
                  </button>
                  {idx < PASOS.length - 1 && (
                    <ChevronRight className="h-4 w-4 text-zinc-300" />
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogHeader>

        {/* ── LOADER mientras esperamos ubigeo ── */}
        {mostrarLoader ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-zinc-400">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm">Cargando datos de la venta...</p>
          </div>
        ) : (
          <FormProvider {...form}>
            {/* Usamos div en lugar de form para evitar submit nativo accidental */}
            <div>
              <div className="max-h-[calc(90vh-200px)] overflow-y-auto px-6 py-5">
                {paso === 0 && <StepDatosCliente />}
                {paso === 1 && <StepUbicacion />}
                {paso === 2 && <StepAudios />}
              </div>

              <div className="flex items-center justify-between border-t border-zinc-100 px-6 py-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={
                    paso === 0 ? handleClose : () => setPaso((p) => p - 1)
                  }
                >
                  {paso === 0 ? (
                    "Cancelar"
                  ) : (
                    <>
                      <ChevronLeft className="mr-1 h-4 w-4" />
                      Anterior
                    </>
                  )}
                </Button>

                {paso < PASOS.length - 1 ? (
                  <Button type="button" onClick={irSiguiente}>
                    Siguiente <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    disabled={isPending}
                    onClick={() => form.handleSubmit(onSubmit)()}
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : esReingreso ? (
                      "Reingresar Venta"
                    ) : (
                      "Registrar Venta"
                    )}
                  </Button>
                )}
              </div>
            </div>
          </FormProvider>
        )}
      </DialogContent>
    </Dialog>
  );
}
