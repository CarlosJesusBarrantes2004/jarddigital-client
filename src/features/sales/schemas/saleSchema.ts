import { z } from "zod";

export const newSaleFormSchema = z
  .object({
    id_tipo_documento: z.string().min(1, "Seleccione un tipo de documento"),
    cliente_numero_doc: z.string().min(8, "Documento inválido"),
    cliente_nombre: z.string().min(3, "Nombre muy corto"),

    representante_legal_dni: z.string().optional(),
    representante_legal_nombre: z.string().optional(),

    cliente_telefono: z.string().min(7, "Teléfono inválido"),
    cliente_email: z.string().email("Correo inválido"),
    cliente_papa: z.string().min(2, "Obligatorio"),
    cliente_mama: z.string().min(2, "Obligatorio"),
    cliente_fecha_nacimiento: z.string().min(1, "Fecha obligatoria"),

    id_distrito_nacimiento: z.string().optional(),
    id_distrito_instalacion: z.string().min(1, "Obligatorio"),
    direccion_detalle: z.string().min(5, "Dirección muy corta"),
    referencias: z.string().optional(),
    coordenadas_gps: z.string().min(5, "Ej: -12.04, -77.04"),
    es_full_claro: z.boolean().default(false),

    id_producto: z.string().min(1, "Seleccione un producto"),
    tecnologia: z.string().min(2, "Obligatorio"),
    numero_instalacion: z.string().min(1, "Obligatorio"),
    plano: z.string().min(1, "Obligatorio"),
    score_crediticio: z.string().optional(),
    id_grabador_audios: z.string().min(1, "Obligatorio"),
  })
  .superRefine((data, ctx) => {
    if (data.id_tipo_documento === "3") {
      if (
        !data.representante_legal_dni ||
        data.representante_legal_dni.length < 8
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Obligatorio para RUC",
          path: ["representante_legal_dni"],
        });
      }
      if (
        !data.representante_legal_nombre ||
        data.representante_legal_nombre.length < 3
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Obligatorio para RUC",
          path: ["representante_legal_nombre"],
        });
      }
    }
  });

export type NewSaleFormData = z.infer<typeof newSaleFormSchema>;

export const backofficeFormSchema = z
  .object({
    codigo_sec: z.string().optional(),
    codigo_sot: z.string().optional(),
    fecha_visita_programada: z.string().optional(),
    id_estado_sot: z.string().optional(),
    id_estado_audios: z.string().optional(),
    observacion_audios: z.string().optional(),
    fecha_real_inst: z.string().optional(),
    fecha_rechazo: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.id_estado_sot) {
      const estadoId = Number(data.id_estado_sot);

      if (
        data.fecha_real_inst &&
        data.fecha_real_inst.length > 0 &&
        !data.id_estado_sot
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Si ingresa fecha de instalación, debe asignar un estado.",
          path: ["fecha_real_inst"],
        });
      }
    }
  });

export type BackofficeFormData = z.infer<typeof backofficeFormSchema>;
