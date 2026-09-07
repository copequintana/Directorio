import type { NextRequest } from "next/server";
import { ok, withApiErrors } from "@/lib/api-response";
import { requireRole } from "@/server/infrastructure/auth-guard";
import { obtenerLoteImportacion } from "@/server/services/historial.service";

type Params = { params: Promise<{ id: string }> };

// {id} es el loteId devuelto por POST /api/importaciones/confirmar.
export const GET = withApiErrors(async (_req: NextRequest, { params }: Params) => {
  await requireRole("CAPTURISTA");
  const { id } = await params;
  const registros = await obtenerLoteImportacion(id);
  return ok({ loteId: id, totalRegistros: registros.length, registros });
});
