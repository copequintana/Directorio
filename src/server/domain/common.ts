import { z } from "zod";

/** Identificador de cualquier entidad (cuid generado por Prisma). */
export const idSchema = z.string().min(1, "Id requerido");

/** Parámetros de paginación compartidos por los listados administrativos. */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type Pagination = z.infer<typeof paginationSchema>;

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** true/false/"todos" — usado por los filtros de "incluir inactivos". */
export const incluirInactivosSchema = z
  .enum(["true", "false"])
  .optional()
  .transform((v) => v === "true");
