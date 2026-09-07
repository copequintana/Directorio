import type { NextRequest } from "next/server";
import { ok, withApiErrors } from "@/lib/api-response";
import { parseJsonBody, parseSearchParams } from "@/lib/api-request";
import { requireRole } from "@/server/infrastructure/auth-guard";
import { edificioInputSchema } from "@/server/domain/ubicaciones";
import { incluirInactivosSchema } from "@/server/domain/common";
import { crearEdificio, listarEdificios } from "@/server/services/ubicaciones.service";
import { z } from "zod";

export const GET = withApiErrors(async (req: NextRequest) => {
  const { campusId, incluirInactivos } = parseSearchParams(
    req,
    z.object({ campusId: z.string().optional(), incluirInactivos: incluirInactivosSchema }),
  );
  const edificios = await listarEdificios({ campusId, incluirInactivos });
  return ok(edificios);
});

export const POST = withApiErrors(async (req: NextRequest) => {
  const sesion = await requireRole("ADMINISTRADOR");
  const input = await parseJsonBody(req, edificioInputSchema);
  const edificio = await crearEdificio(input, sesion.usuarioId);
  return ok(edificio, { status: 201 });
});
