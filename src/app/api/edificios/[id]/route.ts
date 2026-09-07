import type { NextRequest } from "next/server";
import { ok, withApiErrors } from "@/lib/api-response";
import { parseJsonBody } from "@/lib/api-request";
import { requireRole } from "@/server/infrastructure/auth-guard";
import { edificioInputSchema } from "@/server/domain/ubicaciones";
import { actualizarEdificio, desactivarEdificio } from "@/server/services/ubicaciones.service";

type Params = { params: Promise<{ id: string }> };

export const PUT = withApiErrors(async (req: NextRequest, { params }: Params) => {
  const sesion = await requireRole("CAPTURISTA");
  const { id } = await params;
  const input = await parseJsonBody(req, edificioInputSchema.partial());
  const edificio = await actualizarEdificio(id, input, sesion.usuarioId);
  return ok(edificio);
});

export const DELETE = withApiErrors(async (_req: NextRequest, { params }: Params) => {
  const sesion = await requireRole("ADMINISTRADOR");
  const { id } = await params;
  const edificio = await desactivarEdificio(id, sesion.usuarioId);
  return ok(edificio, { message: "Edificio desactivado." });
});
