import type { NextRequest } from "next/server";
import { ok, fail, withApiErrors } from "@/lib/api-response";
import { parseJsonBody } from "@/lib/api-request";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { solicitudCambioInputSchema } from "@/server/domain/solicitud-cambio";
import { crearSolicitud } from "@/server/services/solicitud-cambio.service";

type Params = { params: Promise<{ id: string }> };

// Público a propósito: cualquiera puede reportar un dato incorrecto de una
// extensión sin necesitar cuenta. Un Capturista/Administrador la revisa en
// /admin/solicitudes y aplica el cambio con las herramientas normales.
// Al ser una escritura pública (crea filas), el límite es más estricto que
// el del buscador: 5 / minuto por IP — de sobra para una persona real
// llenando el formulario, no para un bot mandando spam.
export const POST = withApiErrors(async (req: NextRequest, { params }: Params) => {
  const { allowed, retryAfterSeconds } = rateLimit(`solicitud:${clientIp(req)}`, 5, 60_000);
  if (!allowed) {
    return fail("Demasiados reportes seguidos. Intenta de nuevo en un rato.", {
      status: 429,
      errors: [{ retryAfterSeconds }],
    });
  }

  const { id } = await params;
  const input = await parseJsonBody(req, solicitudCambioInputSchema);
  const solicitud = await crearSolicitud(id, input);
  return ok(solicitud, { status: 201 });
});
