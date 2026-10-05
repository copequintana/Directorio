import { api } from "@/lib/api-client";
import type { AsignacionExtension, Extension, HistorialCambios, PaginatedResult } from "@/types/entities";

export interface ListarExtensionesParams {
  q?: string;
  areaId?: string;
  campusId?: string;
  edificioId?: string;
  ubicacionId?: string;
  estado?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: string;
  incluirInactivos?: boolean;
}

export const extensionesService = {
  listar: (params: ListarExtensionesParams = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") query.set(key, String(value));
    });
    return api.get<PaginatedResult<Extension>>(`/api/extensions?${query.toString()}`);
  },
  obtener: (id: string) => api.get<Extension>(`/api/extensions/${id}`),
  crear: (data: Partial<Extension>) => api.post<Extension>("/api/extensions", data),
  actualizar: (id: string, data: Partial<Extension>) =>
    api.put<Extension>(`/api/extensions/${id}`, data),
  desactivar: (id: string) => api.delete<Extension>(`/api/extensions/${id}`),
  historial: (id: string) => api.get<HistorialCambios[]>(`/api/extensions/${id}/historial`),
  asignar: (extensionId: string, data: Partial<AsignacionExtension>) =>
    api.post<AsignacionExtension>(`/api/extensions/${extensionId}/asignaciones`, data),
  editarAsignacion: (extensionId: string, asignacionId: string, data: Partial<AsignacionExtension>) =>
    api.put<AsignacionExtension>(`/api/extensions/${extensionId}/asignaciones/${asignacionId}`, data),
  desasignar: (extensionId: string, asignacionId: string) =>
    api.delete<AsignacionExtension>(`/api/extensions/${extensionId}/asignaciones/${asignacionId}`),
};
