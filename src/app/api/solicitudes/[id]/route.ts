import type { NextRequest } from "next/server";
import { ok, withApiErrors } from "@/lib/api-response";
import { parseJsonBody } from "@/lib/api-request";
import { requireRole } from "@/server/infrastructure/auth-guard";
import { resolverSolicitudSchema } from "@/server/domain/solicitud-cambio";
import { resolverSolicitud } from "@/server/services/solicitud-cambio.service";

type Params = { params: Promise<{ id: string }> };

export const PUT = withApiErrors(async (req: NextRequest, { params }: Params) => {
  const sesion = await requireRole("CAPTURISTA");
  const { id } = await params;
  const input = await parseJsonBody(req, resolverSolicitudSchema);
  const solicitud = await resolverSolicitud(id, input, sesion.usuarioId);
  return ok(solicitud);
});
