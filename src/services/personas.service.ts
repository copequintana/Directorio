import { api } from "@/lib/api-client";
import type { PaginatedResult, Persona } from "@/types/entities";

export interface ListarPersonasParams {
  q?: string;
  areaId?: string;
  page?: number;
  pageSize?: number;
  incluirInactivos?: boolean;
}

export const personasService = {
  listar: (params: ListarPersonasParams = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") query.set(key, String(value));
    });
    return api.get<PaginatedResult<Persona>>(`/api/personas?${query.toString()}`);
  },
  obtener: (id: string) => api.get<Persona>(`/api/personas/${id}`),
  crear: (data: Partial<Persona>) => api.post<Persona>("/api/personas", data),
  actualizar: (id: string, data: Partial<Persona>) => api.put<Persona>(`/api/personas/${id}`, data),
  desactivar: (id: string) => api.delete<Persona>(`/api/personas/${id}`),
};
