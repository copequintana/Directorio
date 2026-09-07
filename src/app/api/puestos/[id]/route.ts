import type { NextRequest } from "next/server";
import { ok, withApiErrors } from "@/lib/api-response";
import { parseJsonBody } from "@/lib/api-request";
import { requireRole } from "@/server/infrastructure/auth-guard";
import { puestoInputSchema } from "@/server/domain/catalogos";
import { actualizarPuesto, desactivarPuesto } from "@/server/services/catalogos.service";

type Params = { params: Promise<{ id: string }> };

export const PUT = withApiErrors(async (req: NextRequest, { params }: Params) => {
  const sesion = await requireRole("CAPTURISTA");
  const { id } = await params;
  const input = await parseJsonBody(req, puestoInputSchema.partial());
  const puesto = await actualizarPuesto(id, input, sesion.usuarioId);
  return ok(puesto);
});

export const DELETE = withApiErrors(async (_req: NextRequest, { params }: Params) => {
  const sesion = await requireRole("ADMINISTRADOR");
  const { id } = await params;
  const puesto = await desactivarPuesto(id, sesion.usuarioId);
  return ok(puesto, { message: "Puesto desactivado." });
});
