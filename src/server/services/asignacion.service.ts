import { prisma } from "@/lib/db/prisma";
import { ServiceError } from "@/server/infrastructure/errors";
import { registrarHistorial } from "@/server/infrastructure/historial";
import type { AsignacionInput } from "@/server/domain/asignacion";
import type { Prisma } from "@/generated/prisma/client";

/**
 * Crea una asignación de extensión (spec 5.8): admite persona, área/servicio
 * o ninguna (sin persona). Si se marca esPrincipal, se desmarca cualquier
 * otra asignación principal activa de la misma extensión (a lo sumo una
 * principal por extensión; esto se controla aquí porque Postgres/Prisma no
 * expresan un índice único parcial directamente en el schema).
 */
export async function crearAsignacion(
  extensionId: string,
  input: AsignacionInput,
  usuarioId: string,
) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const extension = await tx.extension.findUnique({ where: { id: extensionId } });
    if (!extension) throw new ServiceError(404, "Extensión no encontrada.");

    if (input.personaId) {
      const persona = await tx.persona.findUnique({ where: { id: input.personaId } });
      if (!persona) throw new ServiceError(400, "La persona indicada no existe.");
    }

    if (input.esPrincipal) {
      await tx.asignacionExtension.updateMany({
        where: { extensionId, activo: true, esPrincipal: true },
        data: { esPrincipal: false },
      });
    }

    const asignacion = await tx.asignacionExtension.create({
      data: { ...input, extensionId },
    });

    // SinAsignar solo se retira automáticamente cuando el estado no fue
    // fijado manualmente a algo más específico (Mantenimiento/Reservada/etc).
    if (extension.estado === "SIN_ASIGNAR") {
      await tx.extension.update({ where: { id: extensionId }, data: { estado: "ACTIVA" } });
    }

    await registrarHistorial(tx, {
      entidad: "AsignacionExtension",
      entidadId: asignacion.id,
      accion: "ASIGNAR",
      valoresNuevos: asignacion,
      usuarioId,
    });
    return asignacion;
  });
}

/**
 * Edita una asignación existente (p. ej. corregir el área/ubicación sin
 * tener que quitarla y volver a crearla, lo que perdería fechaInicio y
 * generaría un ASIGNAR/DESASIGNAR espurio en el historial).
 */
export async function actualizarAsignacion(
  extensionId: string,
  asignacionId: string,
  input: Partial<AsignacionInput>,
  usuarioId: string,
) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const anterior = await tx.asignacionExtension.findUnique({ where: { id: asignacionId } });
    if (!anterior || anterior.extensionId !== extensionId) {
      throw new ServiceError(404, "Asignación no encontrada.");
    }

    if (input.personaId) {
      const persona = await tx.persona.findUnique({ where: { id: input.personaId } });
      if (!persona) throw new ServiceError(400, "La persona indicada no existe.");
    }

    if (input.esPrincipal) {
      await tx.asignacionExtension.updateMany({
        where: { extensionId, activo: true, esPrincipal: true, id: { not: asignacionId } },
        data: { esPrincipal: false },
      });
    }

    const actualizada = await tx.asignacionExtension.update({
      where: { id: asignacionId },
      data: input,
    });

    await registrarHistorial(tx, {
      entidad: "AsignacionExtension",
      entidadId: asignacionId,
      accion: "ACTUALIZAR",
      valoresAnteriores: anterior,
      valoresNuevos: actualizada,
      usuarioId,
    });
    return actualizada;
  });
}

export function contarAsignacionesSinUbicacion() {
  return prisma.asignacionExtension.count({ where: { activo: true, ubicacionId: null } });
}

/**
 * Pone `ubicacionId` en todas las asignaciones activas que no tienen
 * ninguna — útil para cerrar la brecha con un marcador explícito (p. ej.
 * "Ubicación desconocida" dentro de un edificio real) en vez de dejarlas
 * sin ubicación indefinidamente. No toca las que ya tienen una.
 */
export async function asignarUbicacionATodasSinUbicacion(ubicacionId: string, usuarioId: string) {
  return prisma.$transaction(
    async (tx: Prisma.TransactionClient) => {
      const ubicacion = await tx.ubicacion.findUnique({ where: { id: ubicacionId } });
      if (!ubicacion) throw new ServiceError(404, "Ubicación no encontrada.");

      const pendientes = await tx.asignacionExtension.findMany({
        where: { activo: true, ubicacionId: null },
      });

      for (const anterior of pendientes) {
        const actualizada = await tx.asignacionExtension.update({
          where: { id: anterior.id },
          data: { ubicacionId },
        });
        await registrarHistorial(tx, {
          entidad: "AsignacionExtension",
          entidadId: anterior.id,
          accion: "ACTUALIZAR",
          valoresAnteriores: anterior,
          valoresNuevos: actualizada,
          usuarioId,
        });
      }

      return { actualizadas: pendientes.length };
    },
    { timeout: 120_000 },
  );
}

/** Termina una asignación sin borrarla (fechaFin), preservando el historial. */
export async function eliminarAsignacion(
  extensionId: string,
  asignacionId: string,
  usuarioId: string,
) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const asignacion = await tx.asignacionExtension.findUnique({ where: { id: asignacionId } });
    if (!asignacion || asignacion.extensionId !== extensionId) {
      throw new ServiceError(404, "Asignación no encontrada.");
    }

    const actualizada = await tx.asignacionExtension.update({
      where: { id: asignacionId },
      data: { activo: false, fechaFin: new Date() },
    });

    const quedanActivas = await tx.asignacionExtension.count({
      where: { extensionId, activo: true },
    });
    if (quedanActivas === 0) {
      const extension = await tx.extension.findUnique({ where: { id: extensionId } });
      if (extension?.estado === "ACTIVA") {
        await tx.extension.update({ where: { id: extensionId }, data: { estado: "SIN_ASIGNAR" } });
      }
    }

    await registrarHistorial(tx, {
      entidad: "AsignacionExtension",
      entidadId: asignacionId,
      accion: "DESASIGNAR",
      valoresAnteriores: asignacion,
      valoresNuevos: actualizada,
      usuarioId,
    });
    return actualizada;
  });
}
