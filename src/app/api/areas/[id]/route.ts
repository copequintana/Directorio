import type { NextRequest } from "next/server";
import { ok, withApiErrors } from "@/lib/api-response";
import { parseJsonBody } from "@/lib/api-request";
import { requireRole } from "@/server/infrastructure/auth-guard";
import { areaInputSchema } from "@/server/domain/catalogos";
import { prisma } from "@/lib/db/prisma";
import { ServiceError } from "@/lib/api-response";
import { actualizarArea, desactivarArea } from "@/server/services/catalogos.service";

type Params = { params: Promise<{ id: string }> };

export const GET = withApiErrors(async (_req: NextRequest, { params }: Params) => {
  const { id } = await params;
  const area = await prisma.area.findUnique({
    where: { id },
    include: { subareas: true, areaPadre: true },
  });
  if (!area) throw new ServiceError(404, "Área no encontrada.");
  return ok(area);
});

export const PUT = withApiErrors(async (req: NextRequest, { params }: Params) => {
  const sesion = await requireRole("CAPTURISTA");
  const { id } = await params;
  const input = await parseJsonBody(req, areaInputSchema.partial());
  const area = await actualizarArea(id, input, sesion.usuarioId);
  return ok(area);
});

export const DELETE = withApiErrors(async (_req: NextRequest, { params }: Params) => {
  const sesion = await requireRole("ADMINISTRADOR");
  const { id } = await params;
  const area = await desactivarArea(id, sesion.usuarioId);
  return ok(area, { message: "Área desactivada." });
});
