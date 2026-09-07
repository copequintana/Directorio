import type { NextRequest } from "next/server";
import { ok, withApiErrors } from "@/lib/api-response";
import { parseJsonBody } from "@/lib/api-request";
import { requireRole } from "@/server/infrastructure/auth-guard";
import { asignacionInputSchema } from "@/server/domain/asignacion";
import { crearAsignacion } from "@/server/services/asignacion.service";

type Params = { params: Promise<{ id: string }> };

export const POST = withApiErrors(async (req: NextRequest, { params }: Params) => {
  const sesion = await requireRole("CAPTURISTA");
  const { id } = await params;
  const input = await parseJsonBody(req, asignacionInputSchema);
  const asignacion = await crearAsignacion(id, input, sesion.usuarioId);
  return ok(asignacion, { status: 201 });
});
