import type { NextRequest } from "next/server";
import { ok, withApiErrors } from "@/lib/api-response";
import { requireRole } from "@/server/infrastructure/auth-guard";
import { eliminarAsignacion } from "@/server/services/asignacion.service";

type Params = { params: Promise<{ id: string; asignacionId: string }> };

export const DELETE = withApiErrors(async (_req: NextRequest, { params }: Params) => {
  const sesion = await requireRole("CAPTURISTA");
  const { id, asignacionId } = await params;
  const asignacion = await eliminarAsignacion(id, asignacionId, sesion.usuarioId);
  return ok(asignacion, { message: "Asignación finalizada." });
});
