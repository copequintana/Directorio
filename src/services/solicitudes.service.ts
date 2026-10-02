import { api } from "@/lib/api-client";
import type { SolicitudCambio } from "@/types/entities";

export interface SolicitudCambioInput {
  nombreSolicitante: string;
  correoSolicitante?: string;
  mensaje: string;
}

export const solicitudesService = {
  reportar: (extensionId: string, data: SolicitudCambioInput) =>
    api.post<SolicitudCambio>(`/api/extensions/${extensionId}/solicitudes`, data),
  listar: (estado?: string) =>
    api.get<SolicitudCambio[]>(`/api/solicitudes${estado ? `?estado=${estado}` : ""}`),
  resolver: (id: string, data: { estado: "APLICADA" | "RECHAZADA"; notaAdmin?: string }) =>
    api.put<SolicitudCambio>(`/api/solicitudes/${id}`, data),
};
