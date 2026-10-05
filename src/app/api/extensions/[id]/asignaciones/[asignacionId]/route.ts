import type { NextRequest } from "next/server";
import { ok, withApiErrors } from "@/lib/api-response";
import { parseJsonBody } from "@/lib/api-request";
import { requireRole } from "@/server/infrastructure/auth-guard";
import { asignacionInputSchema } from "@/server/domain/asignacion";
import { actualizarAsignacion, eliminarAsignacion } from "@/server/services/asignacion.service";

type Params = { params: Promise<{ id: string; asignacionId: string }> };

export const PUT = withApiErrors(async (req: NextRequest, { params }: Params) => {
  const sesion = await requireRole("CAPTURISTA");
  const { id, asignacionId } = await params;
  const input = await parseJsonBody(req, asignacionInputSchema.partial());
  const asignacion = await actualizarAsignacion(id, asignacionId, input, sesion.usuarioId);
  return ok(asignacion);
});

export const DELETE = withApiErrors(async (_req: NextRequest, { params }: Params) => {
  const sesion = await requireRole("CAPTURISTA");
  const { id, asignacionId } = await params;
  const asignacion = await eliminarAsignacion(id, asignacionId, sesion.usuarioId);
  return ok(asignacion, { message: "Asignación finalizada." });
});
