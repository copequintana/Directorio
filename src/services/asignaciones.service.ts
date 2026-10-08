import { api } from "@/lib/api-client";

export const asignacionesService = {
  contarSinUbicacion: () => api.get<{ pendientes: number }>("/api/asignaciones/completar-ubicacion"),
  completarUbicacion: (ubicacionId: string) =>
    api.post<{ actualizadas: number }>("/api/asignaciones/completar-ubicacion", { ubicacionId }),
};
