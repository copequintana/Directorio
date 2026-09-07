import { prisma } from "@/lib/db/prisma";
import { ServiceError } from "@/server/infrastructure/errors";
import { registrarHistorial } from "@/server/infrastructure/historial";
import type { AreaInput, PuestoInput } from "@/server/domain/catalogos";

// --- Área (con jerarquía área/subárea, spec 5.4) --------------------------

export function listarAreas(incluirInactivos = false) {
  return prisma.area.findMany({
    where: incluirInactivos ? {} : { activo: true },
    include: { subareas: true },
    orderBy: { nombre: "asc" },
  });
}

export async function crearArea(input: AreaInput, usuarioId: string) {
  return prisma.$transaction(async (tx) => {
    if (input.areaPadreId) {
      const padre = await tx.area.findUnique({ where: { id: input.areaPadreId } });
      if (!padre) throw new ServiceError(400, "El área padre indicada no existe.");
    }

    const area = await tx.area.create({ data: input });
    await registrarHistorial(tx, {
      entidad: "Area",
      entidadId: area.id,
      accion: "CREAR",
      valoresNuevos: area,
      usuarioId,
    });
    return area;
  });
}

export async function actualizarArea(id: string, input: Partial<AreaInput>, usuarioId: string) {
  return prisma.$transaction(async (tx) => {
    const anterior = await tx.area.findUnique({ where: { id } });
    if (!anterior) throw new ServiceError(404, "Área no encontrada.");

    if (input.areaPadreId === id) {
      throw new ServiceError(400, "Un área no puede ser su propia área padre.");
    }

    const actualizada = await tx.area.update({ where: { id }, data: input });
    await registrarHistorial(tx, {
      entidad: "Area",
      entidadId: id,
      accion: "ACTUALIZAR",
      valoresAnteriores: anterior,
      valoresNuevos: actualizada,
      usuarioId,
    });
    return actualizada;
  });
}

export async function desactivarArea(id: string, usuarioId: string) {
  return prisma.$transaction(async (tx) => {
    const anterior = await tx.area.findUnique({ where: { id } });
    if (!anterior) throw new ServiceError(404, "Área no encontrada.");

    const actualizada = await tx.area.update({ where: { id }, data: { activo: false } });
    await registrarHistorial(tx, {
      entidad: "Area",
      entidadId: id,
      accion: "DESACTIVAR",
      valoresAnteriores: anterior,
      valoresNuevos: actualizada,
      usuarioId,
    });
    return actualizada;
  });
}

// --- Puesto ------------------------------------------------------------

export function listarPuestos(incluirInactivos = false) {
  return prisma.puesto.findMany({
    where: incluirInactivos ? {} : { activo: true },
    orderBy: { nombre: "asc" },
  });
}

export async function crearPuesto(input: PuestoInput, usuarioId: string) {
  return prisma.$transaction(async (tx) => {
    const existente = await tx.puesto.findUnique({ where: { nombre: input.nombre } });
    if (existente) {
      throw new ServiceError(409, `Ya existe el puesto "${input.nombre}".`);
    }

    const puesto = await tx.puesto.create({ data: input });
    await registrarHistorial(tx, {
      entidad: "Puesto",
      entidadId: puesto.id,
      accion: "CREAR",
      valoresNuevos: puesto,
      usuarioId,
    });
    return puesto;
  });
}

export async function actualizarPuesto(
  id: string,
  input: Partial<PuestoInput>,
  usuarioId: string,
) {
  return prisma.$transaction(async (tx) => {
    const anterior = await tx.puesto.findUnique({ where: { id } });
    if (!anterior) throw new ServiceError(404, "Puesto no encontrado.");

    const actualizado = await tx.puesto.update({ where: { id }, data: input });
    await registrarHistorial(tx, {
      entidad: "Puesto",
      entidadId: id,
      accion: "ACTUALIZAR",
      valoresAnteriores: anterior,
      valoresNuevos: actualizado,
      usuarioId,
    });
    return actualizado;
  });
}

export async function desactivarPuesto(id: string, usuarioId: string) {
  return prisma.$transaction(async (tx) => {
    const anterior = await tx.puesto.findUnique({ where: { id } });
    if (!anterior) throw new ServiceError(404, "Puesto no encontrado.");

    const actualizado = await tx.puesto.update({ where: { id }, data: { activo: false } });
    await registrarHistorial(tx, {
      entidad: "Puesto",
      entidadId: id,
      accion: "DESACTIVAR",
      valoresAnteriores: anterior,
      valoresNuevos: actualizado,
      usuarioId,
    });
    return actualizado;
  });
}
