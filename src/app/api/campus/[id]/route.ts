import type { NextRequest } from "next/server";
import { ok, withApiErrors } from "@/lib/api-response";
import { parseJsonBody } from "@/lib/api-request";
import { requireRole } from "@/server/infrastructure/auth-guard";
import { campusInputSchema } from "@/server/domain/ubicaciones";
import { actualizarCampus, desactivarCampus } from "@/server/services/ubicaciones.service";

type Params = { params: Promise<{ id: string }> };

export const PUT = withApiErrors(async (req: NextRequest, { params }: Params) => {
  const sesion = await requireRole("CAPTURISTA");
  const { id } = await params;
  const input = await parseJsonBody(req, campusInputSchema.partial());
  const campus = await actualizarCampus(id, input, sesion.usuarioId);
  return ok(campus);
});

export const DELETE = withApiErrors(async (_req: NextRequest, { params }: Params) => {
  const sesion = await requireRole("ADMINISTRADOR");
  const { id } = await params;
  const campus = await desactivarCampus(id, sesion.usuarioId);
  return ok(campus, { message: "Campus desactivado." });
});
