import type { NextRequest } from "next/server";
import { ok, withApiErrors } from "@/lib/api-response";
import { parseJsonBody } from "@/lib/api-request";
import { requireRole } from "@/server/infrastructure/auth-guard";
import { posicionEdificioSchema } from "@/server/domain/ubicaciones";
import { posicionarEdificio } from "@/server/services/ubicaciones.service";

type Params = { params: Promise<{ id: string }> };

export const PUT = withApiErrors(async (req: NextRequest, { params }: Params) => {
  await requireRole("CAPTURISTA");
  const { id } = await params;
  const { mapaX, mapaY } = await parseJsonBody(req, posicionEdificioSchema);
  const edificio = await posicionarEdificio(id, mapaX, mapaY);
  return ok(edificio);
});
