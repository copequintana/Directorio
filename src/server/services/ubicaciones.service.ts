import { prisma } from "@/lib/db/prisma";
import { ServiceError } from "@/server/infrastructure/errors";
import { registrarHistorial } from "@/server/infrastructure/historial";
import type { CampusInput, EdificioInput, UbicacionInput } from "@/server/domain/ubicaciones";

// --- Campus ------------------------------------------------------------

export function listarCampus(incluirInactivos = false) {
  return prisma.campus.findMany({
    where: incluirInactivos ? {} : { activo: true },
    orderBy: { nombre: "asc" },
  });
}

export async function crearCampus(input: CampusInput, usuarioId: string) {
  return prisma.$transaction(async (tx) => {
    const existente = await tx.campus.findUnique({ where: { clave: input.clave } });
    if (existente) {
      throw new ServiceError(409, `Ya existe un campus con la clave "${input.clave}".`);
    }

    const campus = await tx.campus.create({ data: input });
    await registrarHistorial(tx, {
      entidad: "Campus",
      entidadId: campus.id,
      accion: "CREAR",
      valoresNuevos: campus,
      usuarioId,
    });
    return campus;
  });
}

export async function actualizarCampus(id: string, input: Partial<CampusInput>, usuarioId: string) {
  return prisma.$transaction(async (tx) => {
    const anterior = await tx.campus.findUnique({ where: { id } });
    if (!anterior) throw new ServiceError(404, "Campus no encontrado.");

    const actualizado = await tx.campus.update({ where: { id }, data: input });
    await registrarHistorial(tx, {
      entidad: "Campus",
      entidadId: id,
      accion: "ACTUALIZAR",
      valoresAnteriores: anterior,
      valoresNuevos: actualizado,
      usuarioId,
    });
    return actualizado;
  });
}

export async function desactivarCampus(id: string, usuarioId: string) {
  return prisma.$transaction(async (tx) => {
    const anterior = await tx.campus.findUnique({ where: { id } });
    if (!anterior) throw new ServiceError(404, "Campus no encontrado.");

    const actualizado = await tx.campus.update({ where: { id }, data: { activo: false } });
    await registrarHistorial(tx, {
      entidad: "Campus",
      entidadId: id,
      accion: "DESACTIVAR",
      valoresAnteriores: anterior,
      valoresNuevos: actualizado,
      usuarioId,
    });
    return actualizado;
  });
}

// --- Edificio ------------------------------------------------------------

export function listarEdificios(filtros: { campusId?: string; incluirInactivos?: boolean } = {}) {
  return prisma.edificio.findMany({
    where: {
      ...(filtros.incluirInactivos ? {} : { activo: true }),
      ...(filtros.campusId ? { campusId: filtros.campusId } : {}),
    },
    include: { campus: true },
    orderBy: { nombre: "asc" },
  });
}

export async function crearEdificio(input: EdificioInput, usuarioId: string) {
  return prisma.$transaction(async (tx) => {
    const campus = await tx.campus.findUnique({ where: { id: input.campusId } });
    if (!campus) throw new ServiceError(400, "El campus indicado no existe.");

    const edificio = await tx.edificio.create({ data: input });
    await registrarHistorial(tx, {
      entidad: "Edificio",
      entidadId: edificio.id,
      accion: "CREAR",
      valoresNuevos: edificio,
      usuarioId,
    });
    return edificio;
  });
}

export async function actualizarEdificio(
  id: string,
  input: Partial<EdificioInput>,
  usuarioId: string,
) {
  return prisma.$transaction(async (tx) => {
    const anterior = await tx.edificio.findUnique({ where: { id } });
    if (!anterior) throw new ServiceError(404, "Edificio no encontrado.");

    const actualizado = await tx.edificio.update({ where: { id }, data: input });
    await registrarHistorial(tx, {
      entidad: "Edificio",
      entidadId: id,
      accion: "ACTUALIZAR",
      valoresAnteriores: anterior,
      valoresNuevos: actualizado,
      usuarioId,
    });
    return actualizado;
  });
}

export async function desactivarEdificio(id: string, usuarioId: string) {
  return prisma.$transaction(async (tx) => {
    const anterior = await tx.edificio.findUnique({ where: { id } });
    if (!anterior) throw new ServiceError(404, "Edificio no encontrado.");

    const actualizado = await tx.edificio.update({ where: { id }, data: { activo: false } });
    await registrarHistorial(tx, {
      entidad: "Edificio",
      entidadId: id,
      accion: "DESACTIVAR",
      valoresAnteriores: anterior,
      valoresNuevos: actualizado,
      usuarioId,
    });
    return actualizado;
  });
}

/** Campus + sus edificios, para la vista de mapa (pública y de admin). */
export function obtenerMapaCampus(campusId: string) {
  return prisma.campus.findUnique({
    where: { id: campusId },
    include: { edificios: { where: { activo: true }, orderBy: { nombre: "asc" } } },
  });
}

/** Reposiciona el pin de un edificio en el mapa del campus. No pasa por
 * historial: es un ajuste visual, no un cambio de los datos del edificio. */
export async function posicionarEdificio(id: string, mapaX: number, mapaY: number) {
  const edificio = await prisma.edificio.findUnique({ where: { id } });
  if (!edificio) throw new ServiceError(404, "Edificio no encontrado.");

  return prisma.edificio.update({ where: { id }, data: { mapaX, mapaY } });
}

// --- Ubicación ------------------------------------------------------------

export function listarUbicaciones(
  filtros: { edificioId?: string; tipo?: string; incluirInactivos?: boolean } = {},
) {
  return prisma.ubicacion.findMany({
    where: {
      ...(filtros.incluirInactivos ? {} : { activo: true }),
      ...(filtros.edificioId ? { edificioId: filtros.edificioId } : {}),
      ...(filtros.tipo ? { tipo: filtros.tipo as never } : {}),
    },
    include: { edificio: { include: { campus: true } } },
    orderBy: [{ tipo: "asc" }, { nombre: "asc" }],
  });
}

export async function crearUbicacion(input: UbicacionInput, usuarioId: string) {
  return prisma.$transaction(async (tx) => {
    if (input.edificioId) {
      const edificio = await tx.edificio.findUnique({ where: { id: input.edificioId } });
      if (!edificio) throw new ServiceError(400, "El edificio indicado no existe.");
    }

    const ubicacion = await tx.ubicacion.create({ data: input });
    await registrarHistorial(tx, {
      entidad: "Ubicacion",
      entidadId: ubicacion.id,
      accion: "CREAR",
      valoresNuevos: ubicacion,
      usuarioId,
    });
    return ubicacion;
  });
}

export async function actualizarUbicacion(
  id: string,
  input: Partial<UbicacionInput>,
  usuarioId: string,
) {
  return prisma.$transaction(async (tx) => {
    const anterior = await tx.ubicacion.findUnique({ where: { id } });
    if (!anterior) throw new ServiceError(404, "Ubicación no encontrada.");

    const actualizada = await tx.ubicacion.update({ where: { id }, data: input });
    await registrarHistorial(tx, {
      entidad: "Ubicacion",
      entidadId: id,
      accion: "ACTUALIZAR",
      valoresAnteriores: anterior,
      valoresNuevos: actualizada,
      usuarioId,
    });
    return actualizada;
  });
}

export async function desactivarUbicacion(id: string, usuarioId: string) {
  return prisma.$transaction(async (tx) => {
    const anterior = await tx.ubicacion.findUnique({ where: { id } });
    if (!anterior) throw new ServiceError(404, "Ubicación no encontrada.");

    const actualizada = await tx.ubicacion.update({ where: { id }, data: { activo: false } });
    await registrarHistorial(tx, {
      entidad: "Ubicacion",
      entidadId: id,
      accion: "DESACTIVAR",
      valoresAnteriores: anterior,
      valoresNuevos: actualizada,
      usuarioId,
    });
    return actualizada;
  });
}
