import type { NextRequest } from "next/server";
import { ok, withApiErrors } from "@/lib/api-response";
import { parseJsonBody, parseSearchParams } from "@/lib/api-request";
import { requireRole } from "@/server/infrastructure/auth-guard";
import { ubicacionInputSchema } from "@/server/domain/ubicaciones";
import { incluirInactivosSchema } from "@/server/domain/common";
import { crearUbicacion, listarUbicaciones } from "@/server/services/ubicaciones.service";
import { z } from "zod";

export const GET = withApiErrors(async (req: NextRequest) => {
  const { edificioId, tipo, incluirInactivos } = parseSearchParams(
    req,
    z.object({
      edificioId: z.string().optional(),
      tipo: z.string().optional(),
      incluirInactivos: incluirInactivosSchema,
    }),
  );
  const ubicaciones = await listarUbicaciones({ edificioId, tipo, incluirInactivos });
  return ok(ubicaciones);
});

export const POST = withApiErrors(async (req: NextRequest) => {
  const sesion = await requireRole("CAPTURISTA");
  const input = await parseJsonBody(req, ubicacionInputSchema);
  const ubicacion = await crearUbicacion(input, sesion.usuarioId);
  return ok(ubicacion, { status: 201 });
});
