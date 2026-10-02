import { prisma } from "@/lib/db/prisma";
import { ServiceError } from "@/server/infrastructure/errors";
import type {
  EstadoSolicitud,
  ResolverSolicitudInput,
  SolicitudCambioInput,
} from "@/server/domain/solicitud-cambio";

export async function crearSolicitud(extensionId: string, input: SolicitudCambioInput) {
  const extension = await prisma.extension.findUnique({ where: { id: extensionId } });
  if (!extension || !extension.activo) {
    throw new ServiceError(404, "Extensión no encontrada.");
  }

  return prisma.solicitudCambio.create({
    data: {
      extensionId,
      nombreSolicitante: input.nombreSolicitante,
      correoSolicitante: input.correoSolicitante || null,
      mensaje: input.mensaje,
    },
  });
}

export function listarSolicitudes(estado?: EstadoSolicitud) {
  return prisma.solicitudCambio.findMany({
    where: estado ? { estado } : {},
    include: {
      extension: { select: { id: true, numero: true } },
      usuarioResolvio: { select: { id: true, nombre: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function resolverSolicitud(
  id: string,
  input: ResolverSolicitudInput,
  usuarioId: string,
) {
  const solicitud = await prisma.solicitudCambio.findUnique({ where: { id } });
  if (!solicitud) throw new ServiceError(404, "Solicitud no encontrada.");
  if (solicitud.estado !== "PENDIENTE") {
    throw new ServiceError(409, "Esta solicitud ya fue resuelta.");
  }

  return prisma.solicitudCambio.update({
    where: { id },
    data: {
      estado: input.estado,
      notaAdmin: input.notaAdmin || null,
      usuarioResolvioId: usuarioId,
      fechaResolucion: new Date(),
    },
  });
}
