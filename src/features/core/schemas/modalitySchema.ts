import { z } from "zod";

export const modalityFormSchema = z.object({
  nombre: z
    .string()
    .min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  activo: z.boolean().default(true),
});

export type ModalityFormData = z.infer<typeof modalityFormSchema>;
