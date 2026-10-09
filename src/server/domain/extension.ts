import { z } from "zod";

export const ESTADOS_EXTENSION = [
  "ACTIVA",
  "INACTIVA",
  "SIN_ASIGNAR",
  "MANTENIMIENTO",
  "RESERVADA",
] as const;

export const extensionInputSchema = z.object({
  numero: z
    .string()
    .min(1, "El número de extensión es requerido")
    .regex(/^[0-9A-Za-z-]+$/, "El número de extensión tiene un formato inválido"),
  tipo: z.string().optional().nullable(),
  estado: z.enum(ESTADOS_EXTENSION).default("SIN_ASIGNAR"),
  observaciones: z.string().optional().nullable(),
  activo: z.boolean().default(true),
});
export type ExtensionInput = z.infer<typeof extensionInputSchema>;

export const extensionListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().max(200).optional(),
  campusId: z.string().optional(),
  areaId: z.string().optional(),
  edificioId: z.string().optional(),
  ubicacionId: z.string().optional(),
  estado: z.enum(ESTADOS_EXTENSION).optional(),
  incluirInactivos: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
  sortBy: z.enum(["numero", "estado", "createdAt", "updatedAt"]).default("numero"),
  sortDir: z.enum(["asc", "desc"]).default("asc"),
});
export type ExtensionListQuery = z.infer<typeof extensionListQuerySchema>;
