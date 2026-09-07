import { prisma } from "@/lib/db/prisma";
import { ServiceError } from "@/server/infrastructure/errors";
import { registrarHistorial } from "@/server/infrastructure/historial";
import { construirNombreCompleto, type PersonaInput } from "@/server/domain/persona";
import type { Pagination } from "@/server/domain/common";

export async function listarPersonas(
  filtros: { q?: string; areaId?: string; incluirInactivos?: boolean } & Pagination,
) {
  const where = {
    ...(filtros.incluirInactivos ? {} : { activo: true }),
    ...(filtros.areaId ? { areaId: filtros.areaId } : {}),
    ...(filtros.q
      ? {
          OR: [
            { nombreCompleto: { contains: filtros.q, mode: "insensitive" as const } },
            { nombre: { contains: filtros.q, mode: "insensitive" as const } },
            { apellidoPaterno: { contains: filtros.q, mode: "insensitive" as const } },
            { apellidoMaterno: { contains: filtros.q, mode: "insensitive" as const } },
            { correo: { contains: filtros.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.persona.findMany({
      where,
      include: { puesto: true, area: true },
      orderBy: { nombreCompleto: "asc" },
      skip: (filtros.page - 1) * filtros.pageSize,
      take: filtros.pageSize,
    }),
    prisma.persona.count({ where }),
  ]);

  return { items, total, page: filtros.page, pageSize: filtros.pageSize };
}

export function obtenerPersona(id: string) {
  return prisma.persona.findUnique({
    where: { id },
    include: { puesto: true, area: true, asignaciones: { include: { extension: true } } },
  });
}

export async function crearPersona(input: PersonaInput, usuarioId: string) {
  return prisma.$transaction(async (tx) => {
    const nombreCompleto = input.nombreCompleto?.trim() || construirNombreCompleto(input);

    const persona = await tx.persona.create({
      data: { ...input, correo: input.correo || null, nombreCompleto },
    });
    await registrarHistorial(tx, {
      entidad: "Persona",
      entidadId: persona.id,
      accion: "CREAR",
      valoresNuevos: persona,
      usuarioId,
    });
    return persona;
  });
}

export async function actualizarPersona(
  id: string,
  input: Partial<PersonaInput>,
  usuarioId: string,
) {
  return prisma.$transaction(async (tx) => {
    const anterior = await tx.persona.findUnique({ where: { id } });
    if (!anterior) throw new ServiceError(404, "Persona no encontrada.");

    const nombreCompleto =
      input.nombreCompleto?.trim() ||
      (input.nombre || input.apellidoPaterno !== undefined || input.apellidoMaterno !== undefined
        ? construirNombreCompleto({
            nombre: input.nombre ?? anterior.nombre,
            apellidoPaterno: input.apellidoPaterno ?? anterior.apellidoPaterno,
            apellidoMaterno: input.apellidoMaterno ?? anterior.apellidoMaterno,
          })
        : undefined);

    const actualizada = await tx.persona.update({
      where: { id },
      data: {
        ...input,
        correo: input.correo === "" ? null : input.correo,
        ...(nombreCompleto ? { nombreCompleto } : {}),
      },
    });
    await registrarHistorial(tx, {
      entidad: "Persona",
      entidadId: id,
      accion: "ACTUALIZAR",
      valoresAnteriores: anterior,
      valoresNuevos: actualizada,
      usuarioId,
    });
    return actualizada;
  });
}

export async function desactivarPersona(id: string, usuarioId: string) {
  return prisma.$transaction(async (tx) => {
    const anterior = await tx.persona.findUnique({ where: { id } });
    if (!anterior) throw new ServiceError(404, "Persona no encontrada.");

    const actualizada = await tx.persona.update({ where: { id }, data: { activo: false } });
    await registrarHistorial(tx, {
      entidad: "Persona",
      entidadId: id,
      accion: "DESACTIVAR",
      valoresAnteriores: anterior,
      valoresNuevos: actualizada,
      usuarioId,
    });
    return actualizada;
  });
}
