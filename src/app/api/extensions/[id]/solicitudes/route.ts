import type { NextRequest } from "next/server";
import { ok, withApiErrors } from "@/lib/api-response";
import { parseJsonBody } from "@/lib/api-request";
import { solicitudCambioInputSchema } from "@/server/domain/solicitud-cambio";
import { crearSolicitud } from "@/server/services/solicitud-cambio.service";

type Params = { params: Promise<{ id: string }> };

// Público a propósito: cualquiera puede reportar un dato incorrecto de una
// extensión sin necesitar cuenta. Un Capturista/Administrador la revisa en
// /admin/solicitudes y aplica el cambio con las herramientas normales.
export const POST = withApiErrors(async (req: NextRequest, { params }: Params) => {
  const { id } = await params;
  const input = await parseJsonBody(req, solicitudCambioInputSchema);
  const solicitud = await crearSolicitud(id, input);
  return ok(solicitud, { status: 201 });
});
