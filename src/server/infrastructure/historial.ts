import type { Prisma } from "@/generated/prisma/client";

export type AccionHistorial =
  | "CREAR"
  | "ACTUALIZAR"
  | "DESACTIVAR"
  | "ASIGNAR"
  | "DESASIGNAR"
  | "IMPORTAR";

interface RegistrarHistorialInput {
  entidad: string;
  entidadId: string;
  accion: AccionHistorial;
  valoresAnteriores?: unknown;
  valoresNuevos?: unknown;
  usuarioId?: string | null;
  loteId?: string | null;
}

/**
 * Único punto de escritura de HistorialCambios (spec 5.10 / 6.7): toda
 * mutación relevante debe pasar por aquí en lugar de insertar la fila de
 * historial "a mano" en cada servicio. Recibe el cliente de la transacción
 * en curso para que el registro de historial sea atómico junto con el
 * cambio que lo origina.
 */
export async function registrarHistorial(
  tx: Prisma.TransactionClient,
  input: RegistrarHistorialInput,
) {
  await tx.historialCambios.create({
    data: {
      entidad: input.entidad,
      entidadId: input.entidadId,
      accion: input.accion,
      valoresAnteriores: toJson(input.valoresAnteriores),
      valoresNuevos: toJson(input.valoresNuevos),
      usuarioId: input.usuarioId ?? null,
      loteId: input.loteId ?? null,
    },
  });
}

function toJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined || value === null) return undefined;
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
