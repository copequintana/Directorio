import type { NextRequest } from "next/server";
import { ok, withApiErrors, ServiceError } from "@/lib/api-response";
import { parseJsonBody } from "@/lib/api-request";
import { requireRole } from "@/server/infrastructure/auth-guard";
import { personaInputSchema } from "@/server/domain/persona";
import {
  actualizarPersona,
  desactivarPersona,
  obtenerPersona,
} from "@/server/services/persona.service";

type Params = { params: Promise<{ id: string }> };

export const GET = withApiErrors(async (_req: NextRequest, { params }: Params) => {
  const { id } = await params;
  const persona = await obtenerPersona(id);
  if (!persona) throw new ServiceError(404, "Persona no encontrada.");
  return ok(persona);
});

export const PUT = withApiErrors(async (req: NextRequest, { params }: Params) => {
  const sesion = await requireRole("CAPTURISTA");
  const { id } = await params;
  const input = await parseJsonBody(req, personaInputSchema.partial());
  const persona = await actualizarPersona(id, input, sesion.usuarioId);
  return ok(persona);
});

export const DELETE = withApiErrors(async (_req: NextRequest, { params }: Params) => {
  const sesion = await requireRole("ADMINISTRADOR");
  const { id } = await params;
  const persona = await desactivarPersona(id, sesion.usuarioId);
  return ok(persona, { message: "Persona desactivada." });
});
