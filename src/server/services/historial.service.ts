import { prisma } from "@/lib/db/prisma";

export function obtenerHistorialEntidad(entidad: string, entidadId: string) {
  return prisma.historialCambios.findMany({
    where: { entidad, entidadId },
    include: { usuario: { select: { id: true, nombre: true, correo: true } } },
    orderBy: { fecha: "desc" },
  });
}

export function obtenerCambiosRecientes(limite = 10) {
  return prisma.historialCambios.findMany({
    take: limite,
    include: { usuario: { select: { id: true, nombre: true, correo: true } } },
    orderBy: { fecha: "desc" },
  });
}

export function obtenerLoteImportacion(loteId: string) {
  return prisma.historialCambios.findMany({
    where: { loteId, accion: "IMPORTAR" },
    orderBy: { fecha: "asc" },
  });
}
