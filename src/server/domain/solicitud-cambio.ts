import { z } from "zod";

export const ESTADOS_SOLICITUD = ["PENDIENTE", "APLICADA", "RECHAZADA"] as const;
export type EstadoSolicitud = (typeof ESTADOS_SOLICITUD)[number];

/** Reporte público (sin cuenta) de un dato incorrecto en una extensión. */
export const solicitudCambioInputSchema = z.object({
  nombreSolicitante: z.string().trim().min(1, "Tu nombre es requerido"),
  correoSolicitante: z.email("Correo inválido").optional().or(z.literal("")),
  mensaje: z
    .string()
    .trim()
    .min(5, "Describe brevemente qué está mal")
    .max(2000, "El mensaje es demasiado largo"),
});
export type SolicitudCambioInput = z.infer<typeof solicitudCambioInputSchema>;

export const resolverSolicitudSchema = z.object({
  estado: z.enum(["APLICADA", "RECHAZADA"]),
  notaAdmin: z.string().trim().max(2000).optional().or(z.literal("")),
});
export type ResolverSolicitudInput = z.infer<typeof resolverSolicitudSchema>;

export const solicitudListQuerySchema = z.object({
  estado: z.enum(ESTADOS_SOLICITUD).optional(),
});
