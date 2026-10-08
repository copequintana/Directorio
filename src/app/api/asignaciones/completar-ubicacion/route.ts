import type { NextRequest } from "next/server";
import { ok, withApiErrors } from "@/lib/api-response";
import { parseJsonBody } from "@/lib/api-request";
import { requireRole } from "@/server/infrastructure/auth-guard";
import { completarUbicacionSchema } from "@/server/domain/asignacion";
import {
  asignarUbicacionATodasSinUbicacion,
  contarAsignacionesSinUbicacion,
} from "@/server/services/asignacion.service";

// Cuántas asignaciones activas todavía no tienen ubicación — para que la UI
// muestre el botón solo cuando hay algo que hacer.
export const GET = withApiErrors(async () => {
  await requireRole("CAPTURISTA");
  const pendientes = await contarAsignacionesSinUbicacion();
  return ok({ pendientes });
});

// Completa en bloque con un marcador explícito (p. ej. "Ubicación
// desconocida") en vez de dejarlas sin ubicación indefinidamente.
export const POST = withApiErrors(async (req: NextRequest) => {
  const sesion = await requireRole("CAPTURISTA");
  const { ubicacionId } = await parseJsonBody(req, completarUbicacionSchema);
  const resultado = await asignarUbicacionATodasSinUbicacion(ubicacionId, sesion.usuarioId);
  return ok(resultado);
});
