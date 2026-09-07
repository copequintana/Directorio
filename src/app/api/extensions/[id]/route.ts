import type { NextRequest } from "next/server";
import { ok, withApiErrors, ServiceError } from "@/lib/api-response";
import { parseJsonBody } from "@/lib/api-request";
import { requireRole } from "@/server/infrastructure/auth-guard";
import { extensionInputSchema } from "@/server/domain/extension";
import {
  actualizarExtension,
  desactivarExtension,
  obtenerExtension,
} from "@/server/services/extension.service";

type Params = { params: Promise<{ id: string }> };

export const GET = withApiErrors(async (_req: NextRequest, { params }: Params) => {
  const { id } = await params;
  const extension = await obtenerExtension(id);
  if (!extension) throw new ServiceError(404, "Extensión no encontrada.");
  return ok(extension);
});

export const PUT = withApiErrors(async (req: NextRequest, { params }: Params) => {
  const sesion = await requireRole("CAPTURISTA");
  const { id } = await params;
  const input = await parseJsonBody(req, extensionInputSchema.partial());
  const extension = await actualizarExtension(id, input, sesion.usuarioId);
  return ok(extension);
});

// Regla de negocio: nunca se elimina físicamente una extensión con
// historial — DELETE siempre desactiva lógicamente (spec 6.5-6.6).
export const DELETE = withApiErrors(async (_req: NextRequest, { params }: Params) => {
  const sesion = await requireRole("ADMINISTRADOR");
  const { id } = await params;
  const extension = await desactivarExtension(id, sesion.usuarioId);
  return ok(extension, { message: "Extensión desactivada." });
});
