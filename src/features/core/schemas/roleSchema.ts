import { z } from "zod";

export const roleFormSchema = z.object({
  codigo: z
    .string()
    .min(2, { message: "El código debe tener al menos 2 caracteres." }),
  nombre: z.string().min(2, { message: "El nombre es obligatorio." }),
  descripcion: z.string().optional(),
  nivel_jerarquia: z
    .number()
    .min(1, { message: "El nivel mínimo es 1." })
    .max(10, { message: "El nivel máximo es 10." }),
  activo: z.boolean(),
});

export type RoleFormData = z.infer<typeof roleFormSchema>;
