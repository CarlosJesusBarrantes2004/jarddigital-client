import { z } from "zod";

// ==========================================
// AUDIO SCHEMA
// ==========================================

export const audioVentaSchema = z.object({
  id: z.number().optional(),
  nombre_etiqueta: z.string().min(1, "Etiqueta requerida"),
  url_audio: z.string().min(1, "URL del audio requerida"),
});

// ==========================================
// SCHEMA BASE DE VENTA (campos del ASESOR)
// ==========================================

export const createVentaSchema = z
  .object({
    // Producto
    id_producto: z.number({ message: "Selecciona un producto" }),
    tecnologia: z.string().min(1, "Selecciona la tecnología"),

    // Documento cliente
    id_tipo_documento: z.number({
      message: "Selecciona tipo de documento",
    }),
    cliente_numero_doc: z
      .string()
      .min(8, "Número de documento inválido")
      .max(20),

    // Datos cliente
    cliente_nombre: z.string().min(3, "Nombre requerido"),
    cliente_telefono: z.string().min(9, "Teléfono inválido").max(20),
    cliente_email: z.string().email("Email inválido"),
    cliente_papa: z.string().min(2, "Apellido paterno requerido"),
    cliente_mama: z.string().min(2, "Apellido materno requerido"),
    cliente_fecha_nacimiento: z
      .string()
      .min(1, "Fecha de nacimiento requerida"),
    numero_instalacion: z.string().min(1, "Número de instalación requerido"),

    // Representante legal (condicional RUC)
    representante_legal_dni: z.string().nullable().optional(),
    representante_legal_nombre: z.string().nullable().optional(),

    // Ubigeo nacimiento (cascada)
    dep_nacimiento_id: z.number().nullable().optional(),
    prov_nacimiento_id: z.number().nullable().optional(),
    id_distrito_nacimiento: z.number().nullable().optional(),

    // Ubigeo instalación (cascada - obligatorio)
    dep_instalacion_id: z.number({ message: "Selecciona departamento" }),
    prov_instalacion_id: z.number({ message: "Selecciona provincia" }),
    id_distrito_instalacion: z.number({
      message: "Selecciona el distrito de instalación",
    }),

    // Ubicación
    referencias: z.string().optional(),
    plano: z.string().min(1, "Plano requerido"),
    direccion_detalle: z.string().min(5, "Dirección requerida"),
    coordenadas_gps: z.string().min(1, "Coordenadas GPS requeridas"),
    es_full_claro: z.boolean().default(false),
    score_crediticio: z.string().min(1, "Score crediticio requerido"),

    // Grabador
    id_grabador_audios: z.number({ message: "Selecciona el grabador" }),

    // Audios
    audios: z.array(audioVentaSchema).min(1, "Agrega los audios"),

    // Campo auxiliar para saber el código del tipo de documento (no se envía al API)
    _codigo_tipo_doc: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const esRuc = data._codigo_tipo_doc?.toUpperCase() === "RUC";

    if (esRuc) {
      if (!data.representante_legal_dni) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "DNI del representante obligatorio para RUC",
          path: ["representante_legal_dni"],
        });
      }
      if (!data.representante_legal_nombre) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Nombre del representante obligatorio para RUC",
          path: ["representante_legal_nombre"],
        });
      }
      const cantidadAudios = data.audios?.length ?? 0;
      if (cantidadAudios !== 14) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Para RUC se requieren 14 audios. Has agregado ${cantidadAudios}.`,
          path: ["audios"],
        });
      }
    } else {
      const cantidadAudios = data.audios?.length ?? 0;
      if (cantidadAudios !== 12) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Para DNI/CE se requieren 12 audios. Has agregado ${cantidadAudios}.`,
          path: ["audios"],
        });
      }
    }
  });

export type CreateVentaFormValues = z.infer<typeof createVentaSchema>;

// ==========================================
// SCHEMA BACKOFFICE - Asignación códigos / estados
// ==========================================

export const updateVentaBackofficeSchema = z
  .object({
    codigo_sec: z.string().optional(),
    codigo_sot: z.string().optional(),
    fecha_visita_programada: z.string().optional(),
    bloque_horario: z.string().optional(),
    id_sub_estado_sot: z.number().nullable().optional(),
    id_estado_sot: z.number().nullable().optional(),
    fecha_real_inst: z.string().nullable().optional(),
    fecha_rechazo: z.string().nullable().optional(),
    comentario_gestion: z.string().nullable().optional(),
    id_estado_audios: z.number().nullable().optional(),
    observacion_audios: z.string().nullable().optional(),

    // Campos auxiliares
    _codigo_estado_destino: z.string().optional(),
    _codigo_estado_audio_destino: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const estado = data._codigo_estado_destino?.toUpperCase();

    if (estado === "RECHAZADO") {
      if (!data.fecha_rechazo) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Fecha de rechazo obligatoria al rechazar",
          path: ["fecha_rechazo"],
        });
      }
      if (!data.comentario_gestion) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Comentario de gestión obligatorio al rechazar",
          path: ["comentario_gestion"],
        });
      }
    }

    if (estado === "ATENDIDO") {
      if (!data.fecha_real_inst) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Fecha real de instalación obligatoria",
          path: ["fecha_real_inst"],
        });
      }
    }
  });

export type UpdateVentaBackofficeValues = z.infer<
  typeof updateVentaBackofficeSchema
>;

// ==========================================
// SCHEMA ASESOR - Corrección (PATCH cuando solicitud_correccion=true)
// ==========================================

export const correccionVentaSchema = createVentaSchema;
export type CorreccionVentaFormValues = CreateVentaFormValues;
