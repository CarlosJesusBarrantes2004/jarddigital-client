import { z } from "zod";

export const userFormSchema = z.object({
  nombre_completo: z.string().min(3, "Debe tener al menos 3 caracteres."),
  username: z.string().min(4, "Debe tener al menos 4 caracteres."),
  email: z.string().email("Formato de correo inválido."),
  password: z.string().optional(),
  id_rol: z.string().min(1, "Debes seleccionar un rol."),
  activo: z.boolean().default(true),
});

export type UserFormData = z.infer<typeof userFormSchema>;
