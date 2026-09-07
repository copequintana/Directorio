import { z } from "zod";

export const TIPOS_ASIGNACION = [
  "INDIVIDUAL",
  "COMPARTIDA",
  "AREA_SERVICIO",
  "SIN_PERSONA",
] as const;

export const asignacionInputSchema = z.object({
  // personaId ausente/null = extensión sin persona (spec 5.8 / 22).
  personaId: z.string().min(1).optional().nullable(),
  areaId: z.string().min(1).optional().nullable(),
  ubicacionId: z.string().min(1).optional().nullable(),
  tipoAsignacion: z.enum(TIPOS_ASIGNACION).default("INDIVIDUAL"),
  esPrincipal: z.boolean().default(true),
  observaciones: z.string().optional().nullable(),
});
export type AsignacionInput = z.infer<typeof asignacionInputSchema>;
