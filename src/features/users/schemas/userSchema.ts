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

  // Acepta vacío (usuarios existentes sin celular) o formato peruano válido.
  // Si está vacío se envía null al backend para no pisar con string vacío.
  celular: z
    .string()
    .refine(
      (val) => val === "" || /^9\d{8}$/.test(val),
      "Debe empezar con 9 y tener exactamente 9 dígitos",
    ),
  password: z.string().optional(),

  id_rol: z
    .number({ message: "Selecciona un rol" })
    .min(1, "Selecciona un rol"),

  activo: z.boolean(),
});

export type UserFormValues = z.infer<typeof userFormSchema>;
