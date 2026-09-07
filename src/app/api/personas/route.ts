import type { NextRequest } from "next/server";
import { ok, withApiErrors } from "@/lib/api-response";
import { parseJsonBody, parseSearchParams } from "@/lib/api-request";
import { requireRole } from "@/server/infrastructure/auth-guard";
import { personaInputSchema } from "@/server/domain/persona";
import { paginationSchema } from "@/server/domain/common";
import { crearPersona, listarPersonas } from "@/server/services/persona.service";
import { z } from "zod";

const querySchema = paginationSchema.extend({
  q: z.string().optional(),
  areaId: z.string().optional(),
  incluirInactivos: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
});

export const GET = withApiErrors(async (req: NextRequest) => {
  const query = parseSearchParams(req, querySchema);
  const resultado = await listarPersonas(query);
  return ok(resultado);
});

export const POST = withApiErrors(async (req: NextRequest) => {
  const sesion = await requireRole("CAPTURISTA");
  const input = await parseJsonBody(req, personaInputSchema);
  const persona = await crearPersona(input, sesion.usuarioId);
  return ok(persona, { status: 201 });
});
