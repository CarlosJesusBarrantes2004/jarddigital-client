import { z } from "zod";

export const modalityFormSchema = z.object({
  nombre: z
    .string()
    .min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  codigo: z
    .string()
    .min(2, { message: "El código debe tener al menos 2 caracteres." })
    .max(20, { message: "El código no puede exceder 20 caracteres." }),
  activo: z.boolean(),
});

export type ModalityFormData = z.infer<typeof modalityFormSchema>;
