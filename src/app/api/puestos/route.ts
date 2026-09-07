import type { NextRequest } from "next/server";
import { ok, withApiErrors } from "@/lib/api-response";
import { parseJsonBody, parseSearchParams } from "@/lib/api-request";
import { requireRole } from "@/server/infrastructure/auth-guard";
import { puestoInputSchema } from "@/server/domain/catalogos";
import { incluirInactivosSchema } from "@/server/domain/common";
import { crearPuesto, listarPuestos } from "@/server/services/catalogos.service";
import { z } from "zod";

export const GET = withApiErrors(async (req: NextRequest) => {
  const { incluirInactivos } = parseSearchParams(
    req,
    z.object({ incluirInactivos: incluirInactivosSchema }),
  );
  const puestos = await listarPuestos(incluirInactivos);
  return ok(puestos);
});

export const POST = withApiErrors(async (req: NextRequest) => {
  const sesion = await requireRole("CAPTURISTA");
  const input = await parseJsonBody(req, puestoInputSchema);
  const puesto = await crearPuesto(input, sesion.usuarioId);
  return ok(puesto, { status: 201 });
});
