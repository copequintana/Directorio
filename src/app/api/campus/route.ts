import type { NextRequest } from "next/server";
import { ok, withApiErrors } from "@/lib/api-response";
import { parseJsonBody, parseSearchParams } from "@/lib/api-request";
import { requireRole } from "@/server/infrastructure/auth-guard";
import { campusInputSchema } from "@/server/domain/ubicaciones";
import { incluirInactivosSchema } from "@/server/domain/common";
import { crearCampus, listarCampus } from "@/server/services/ubicaciones.service";
import { z } from "zod";

export const GET = withApiErrors(async (req: NextRequest) => {
  const { incluirInactivos } = parseSearchParams(
    req,
    z.object({ incluirInactivos: incluirInactivosSchema }),
  );
  const campus = await listarCampus(incluirInactivos);
  return ok(campus);
});

export const POST = withApiErrors(async (req: NextRequest) => {
  const sesion = await requireRole("ADMINISTRADOR");
  const input = await parseJsonBody(req, campusInputSchema);
  const campus = await crearCampus(input, sesion.usuarioId);
  return ok(campus, { status: 201 });
});
