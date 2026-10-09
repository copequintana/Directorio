import { z } from "zod";
import { ESTADOS_EXTENSION } from "./extension";

export const searchQuerySchema = z.object({
  q: z.string().trim().max(200, "La búsqueda es demasiado larga").default(""),
  campusId: z.string().optional(),
  areaId: z.string().optional(),
  edificioId: z.string().optional(),
  ubicacionId: z.string().optional(),
  estado: z.enum(ESTADOS_EXTENSION).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type SearchQuery = z.infer<typeof searchQuerySchema>;

export interface SearchResultItem {
  extensionId: string;
  numero: string;
  estado: string;
  observaciones: string | null;
  personas: { id: string; nombreCompleto: string }[];
  area: { id: string; nombre: string } | null;
  puesto: { id: string; nombre: string } | null;
  ubicacion: {
    id: string;
    tipo: string;
    nombre: string | null;
    numero: string | null;
  } | null;
  edificio: { id: string; nombre: string } | null;
  campus: { id: string; nombre: string } | null;
}
