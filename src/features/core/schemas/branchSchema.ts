import { z } from "zod";

export const branchFormSchema = z.object({
  nombre: z
    .string()
    .min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  direccion: z.string().min(5, { message: "La dirección es muy corta." }),
  activo: z.boolean(),
  ids_modalidades: z
    .array(z.number())
    .min(1, { message: "Debes seleccionar al menos una modalidad operativa." }),
});

export type BranchFormData = z.infer<typeof branchFormSchema>;
