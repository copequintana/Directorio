import type { NextRequest } from "next/server";
import { ok, withApiErrors } from "@/lib/api-response";
import { parseJsonBody, parseSearchParams } from "@/lib/api-request";
import { requireRole } from "@/server/infrastructure/auth-guard";
import { areaInputSchema } from "@/server/domain/catalogos";
import { incluirInactivosSchema } from "@/server/domain/common";
import { crearArea, listarAreas } from "@/server/services/catalogos.service";
import { z } from "zod";

export const GET = withApiErrors(async (req: NextRequest) => {
  const { incluirInactivos } = parseSearchParams(
    req,
    z.object({ incluirInactivos: incluirInactivosSchema }),
  );
  const areas = await listarAreas(incluirInactivos);
  return ok(areas);
});

export const POST = withApiErrors(async (req: NextRequest) => {
  const sesion = await requireRole("CAPTURISTA");
  const input = await parseJsonBody(req, areaInputSchema);
  const area = await crearArea(input, sesion.usuarioId);
  return ok(area, { status: 201 });
});
