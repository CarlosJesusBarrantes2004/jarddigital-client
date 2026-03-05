// ─────────────────────────────────────────────
// Users — Form Validation Schema
// ─────────────────────────────────────────────

import { z } from "zod";

export const userFormSchema = z.object({
  nombre_completo: z
    .string()
    .min(3, "Debe tener al menos 3 caracteres")
    .max(255, "Demasiado largo"),

  username: z
    .string()
    .min(4, "Mínimo 4 caracteres")
    .max(150, "Demasiado largo")
    .regex(/^[a-zA-Z0-9@.+\-_]+$/, "Solo letras, números y @.+-_"),

  email: z.string().email("Correo electrónico inválido"),

  password: z
    .string()
    .optional()
    .transform((v) => (v === "" ? undefined : v)),

  id_rol: z
    .number({ required_error: "Selecciona un rol" })
    .min(1, "Selecciona un rol"),

  activo: z.boolean().default(true),
});

export type UserFormValues = z.infer<typeof userFormSchema>;
