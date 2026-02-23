import { z } from "zod";

export const loginFormSchema = z.object({
  username: z.string().min(1, "El usuario es obligatorio"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

export type LoginFormData = z.infer<typeof loginFormSchema>;
