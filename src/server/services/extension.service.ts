import { prisma } from "@/lib/db/prisma";
import { ServiceError } from "@/server/infrastructure/errors";
import { registrarHistorial } from "@/server/infrastructure/historial";
import type { ExtensionInput, ExtensionListQuery } from "@/server/domain/extension";
import type { Prisma } from "@/generated/prisma/client";

const INCLUDE_DETALLE = {
  asignaciones: {
    where: { activo: true },
    include: { persona: true, area: true, ubicacion: { include: { edificio: { include: { campus: true } } } } },
  },
} satisfies Prisma.ExtensionInclude;

export async function listarExtensiones(filtros: ExtensionListQuery) {
  const ubicacionFiltro: Prisma.UbicacionWhereInput = {};
  if (filtros.edificioId) ubicacionFiltro.edificioId = filtros.edificioId;
  if (filtros.campusId) ubicacionFiltro.edificio = { campusId: filtros.campusId };

  const asignacionFiltro: Prisma.AsignacionExtensionWhereInput = {
    activo: true,
    ...(filtros.areaId ? { areaId: filtros.areaId } : {}),
    ...(filtros.ubicacionId ? { ubicacionId: filtros.ubicacionId } : {}),
    ...(Object.keys(ubicacionFiltro).length > 0 ? { ubicacion: ubicacionFiltro } : {}),
  };
  const requiereAsignacion =
    !!filtros.areaId || !!filtros.ubicacionId || !!filtros.edificioId || !!filtros.campusId;

  const where: Prisma.ExtensionWhereInput = {
    ...(filtros.incluirInactivos ? {} : { activo: true }),
    ...(filtros.estado ? { estado: filtros.estado } : {}),
    ...(filtros.q
      ? {
          OR: [
            { numero: { contains: filtros.q, mode: "insensitive" } },
            { observaciones: { contains: filtros.q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(requiereAsignacion ? { asignaciones: { some: asignacionFiltro } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.extension.findMany({
      where,
      include: INCLUDE_DETALLE,
      orderBy: { [filtros.sortBy]: filtros.sortDir },
      skip: (filtros.page - 1) * filtros.pageSize,
      take: filtros.pageSize,
    }),
    prisma.extension.count({ where }),
  ]);

  return { items, total, page: filtros.page, pageSize: filtros.pageSize };
}

export function obtenerExtension(id: string) {
  return prisma.extension.findUnique({ where: { id }, include: INCLUDE_DETALLE });
}

export async function crearExtension(input: ExtensionInput, usuarioId: string) {
  return prisma.$transaction(async (tx) => {
    const existente = await tx.extension.findUnique({ where: { numero: input.numero } });
    if (existente) {
      throw new ServiceError(409, `La extensión ${input.numero} ya existe.`);
    }

    const extension = await tx.extension.create({ data: input });
    await registrarHistorial(tx, {
      entidad: "Extension",
      entidadId: extension.id,
      accion: "CREAR",
      valoresNuevos: extension,
      usuarioId,
    });
    return extension;
  });
}

export async function actualizarExtension(
  id: string,
  input: Partial<ExtensionInput>,
  usuarioId: string,
) {
  return prisma.$transaction(async (tx) => {
    const anterior = await tx.extension.findUnique({ where: { id } });
    if (!anterior) throw new ServiceError(404, "Extensión no encontrada.");

    if (input.numero && input.numero !== anterior.numero) {
      const conflicto = await tx.extension.findUnique({ where: { numero: input.numero } });
      if (conflicto) {
        throw new ServiceError(409, `La extensión ${input.numero} ya existe.`);
      }
    }

    const actualizada = await tx.extension.update({ where: { id }, data: input });
    await registrarHistorial(tx, {
      entidad: "Extension",
      entidadId: id,
      accion: "ACTUALIZAR",
      valoresAnteriores: anterior,
      valoresNuevos: actualizada,
      usuarioId,
    });
    return actualizada;
  });
}

/**
 * Regla de negocio (spec 6.5-6.6): nunca se elimina físicamente una
 * extensión con historial — DELETE /api/extensions/{id} siempre es una
 * desactivación lógica.
 */
export async function desactivarExtension(id: string, usuarioId: string) {
  return prisma.$transaction(async (tx) => {
    const anterior = await tx.extension.findUnique({ where: { id } });
    if (!anterior) throw new ServiceError(404, "Extensión no encontrada.");

    const actualizada = await tx.extension.update({
      where: { id },
      data: { activo: false, estado: "INACTIVA" },
    });
    await registrarHistorial(tx, {
      entidad: "Extension",
      entidadId: id,
      accion: "DESACTIVAR",
      valoresAnteriores: anterior,
      valoresNuevos: actualizada,
      usuarioId,
    });
    return actualizada;
  });
}
