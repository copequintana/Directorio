import { z } from "zod";

// --- Área (con jerarquía área/subárea) ------------------------------------

export const areaInputSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  descripcion: z.string().optional().nullable(),
  areaPadreId: z.string().min(1).optional().nullable(),
  activo: z.boolean().default(true),
});
export type AreaInput = z.infer<typeof areaInputSchema>;

// --- Puesto ------------------------------------------------------------

export const puestoInputSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  descripcion: z.string().optional().nullable(),
  activo: z.boolean().default(true),
});
export type PuestoInput = z.infer<typeof puestoInputSchema>;
