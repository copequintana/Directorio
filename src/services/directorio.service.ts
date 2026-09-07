import { api } from "@/lib/api-client";
import type { PaginatedResult, SearchResultItem } from "@/types/entities";

export interface BuscarDirectorioParams {
  q?: string;
  campusId?: string;
  areaId?: string;
  edificioId?: string;
  ubicacionId?: string;
  estado?: string;
  page?: number;
  pageSize?: number;
}

export function buscarDirectorio(params: BuscarDirectorioParams) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") query.set(key, String(value));
  });
  return api.get<PaginatedResult<SearchResultItem>>(`/api/directorio/search?${query.toString()}`);
}
