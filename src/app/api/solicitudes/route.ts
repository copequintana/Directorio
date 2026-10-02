import type { NextRequest } from "next/server";
import { ok, withApiErrors } from "@/lib/api-response";
import { parseSearchParams } from "@/lib/api-request";
import { requireRole } from "@/server/infrastructure/auth-guard";
import { solicitudListQuerySchema } from "@/server/domain/solicitud-cambio";
import { listarSolicitudes } from "@/server/services/solicitud-cambio.service";

export const GET = withApiErrors(async (req: NextRequest) => {
  await requireRole("CAPTURISTA");
  const { estado } = parseSearchParams(req, solicitudListQuerySchema);
  const solicitudes = await listarSolicitudes(estado);
  return ok(solicitudes);
});
