import { api } from "@/lib/api-client";
import type { Area, Campus, Edificio, Puesto, Ubicacion } from "@/types/entities";

export const campusService = {
  listar: (incluirInactivos = false) =>
    api.get<Campus[]>(`/api/campus?incluirInactivos=${incluirInactivos}`),
  crear: (data: Partial<Campus>) => api.post<Campus>("/api/campus", data),
  actualizar: (id: string, data: Partial<Campus>) => api.put<Campus>(`/api/campus/${id}`, data),
  desactivar: (id: string) => api.delete<Campus>(`/api/campus/${id}`),
};

export const edificiosService = {
  listar: (params: { campusId?: string; incluirInactivos?: boolean } = {}) => {
    const query = new URLSearchParams();
    if (params.campusId) query.set("campusId", params.campusId);
    if (params.incluirInactivos) query.set("incluirInactivos", "true");
    return api.get<Edificio[]>(`/api/edificios?${query.toString()}`);
  },
  crear: (data: Partial<Edificio>) => api.post<Edificio>("/api/edificios", data),
  actualizar: (id: string, data: Partial<Edificio>) =>
    api.put<Edificio>(`/api/edificios/${id}`, data),
  desactivar: (id: string) => api.delete<Edificio>(`/api/edificios/${id}`),
};

export const ubicacionesService = {
  listar: (params: { edificioId?: string; incluirInactivos?: boolean } = {}) => {
    const query = new URLSearchParams();
    if (params.edificioId) query.set("edificioId", params.edificioId);
    if (params.incluirInactivos) query.set("incluirInactivos", "true");
    return api.get<Ubicacion[]>(`/api/ubicaciones?${query.toString()}`);
  },
  crear: (data: Partial<Ubicacion>) => api.post<Ubicacion>("/api/ubicaciones", data),
  actualizar: (id: string, data: Partial<Ubicacion>) =>
    api.put<Ubicacion>(`/api/ubicaciones/${id}`, data),
  desactivar: (id: string) => api.delete<Ubicacion>(`/api/ubicaciones/${id}`),
};

export const areasService = {
  listar: (incluirInactivos = false) =>
    api.get<Area[]>(`/api/areas?incluirInactivos=${incluirInactivos}`),
  crear: (data: Partial<Area>) => api.post<Area>("/api/areas", data),
  actualizar: (id: string, data: Partial<Area>) => api.put<Area>(`/api/areas/${id}`, data),
  desactivar: (id: string) => api.delete<Area>(`/api/areas/${id}`),
};

export const puestosService = {
  listar: (incluirInactivos = false) =>
    api.get<Puesto[]>(`/api/puestos?incluirInactivos=${incluirInactivos}`),
  crear: (data: Partial<Puesto>) => api.post<Puesto>("/api/puestos", data),
  actualizar: (id: string, data: Partial<Puesto>) => api.put<Puesto>(`/api/puestos/${id}`, data),
  desactivar: (id: string) => api.delete<Puesto>(`/api/puestos/${id}`),
};
