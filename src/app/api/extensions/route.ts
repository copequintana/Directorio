import type { NextRequest } from "next/server";
import { ok, withApiErrors } from "@/lib/api-response";
import { parseJsonBody, parseSearchParams } from "@/lib/api-request";
import { requireRole } from "@/server/infrastructure/auth-guard";
import { extensionInputSchema, extensionListQuerySchema } from "@/server/domain/extension";
import { crearExtension, listarExtensiones } from "@/server/services/extension.service";

export const GET = withApiErrors(async (req: NextRequest) => {
  const query = parseSearchParams(req, extensionListQuerySchema);
  const resultado = await listarExtensiones(query);
  return ok(resultado);
});

export const POST = withApiErrors(async (req: NextRequest) => {
  const sesion = await requireRole("CAPTURISTA");
  const input = await parseJsonBody(req, extensionInputSchema);
  const extension = await crearExtension(input, sesion.usuarioId);
  return ok(extension, { status: 201 });
});
