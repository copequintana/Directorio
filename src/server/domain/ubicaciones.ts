import { z } from "zod";

// --- Campus ------------------------------------------------------------

export const campusInputSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  clave: z.string().min(1, "La clave es requerida"),
  activo: z.boolean().default(true),
});
export type CampusInput = z.infer<typeof campusInputSchema>;

// --- Edificio ------------------------------------------------------------

export const edificioInputSchema = z.object({
  campusId: z.string().min(1, "El campus es requerido"),
  nombre: z.string().min(1, "El nombre es requerido"),
  clave: z.string().optional().nullable(),
  descripcion: z.string().optional().nullable(),
  activo: z.boolean().default(true),
});
export type EdificioInput = z.infer<typeof edificioInputSchema>;

// --- Ubicación ------------------------------------------------------------

export const TIPOS_UBICACION = [
  "OFICINA",
  "CUBICULO",
  "AULA",
  "VENTANILLA",
  "LABORATORIO",
  "SITE",
  "AREA",
  "OTRO",
] as const;

export const ubicacionInputSchema = z.object({
  // Nulo a propósito: no toda ubicación tiene un edificio identificado en
  // los datos de origen (ver docs/DATABASE.md).
  edificioId: z.string().min(1).optional().nullable(),
  tipo: z.enum(TIPOS_UBICACION),
  nombre: z.string().optional().nullable(),
  numero: z.string().optional().nullable(),
  piso: z.string().optional().nullable(),
  descripcion: z.string().optional().nullable(),
  activo: z.boolean().default(true),
});
export type UbicacionInput = z.infer<typeof ubicacionInputSchema>;
