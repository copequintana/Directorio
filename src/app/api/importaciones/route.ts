import type { NextRequest } from "next/server";
import { ok, withApiErrors } from "@/lib/api-response";
import { parseJsonBody } from "@/lib/api-request";
import { requireRole } from "@/server/infrastructure/auth-guard";
import { importAnalyzeRequestSchema } from "@/server/domain/importacion";
import { analizarImportacion } from "@/server/services/importacion.service";

// Analiza y valida el archivo sin persistir nada — la vista previa que
// exige la spec (sección 15) antes de permitir confirmar la importación.
export const POST = withApiErrors(async (req: NextRequest) => {
  await requireRole("CAPTURISTA");
  const { filas } = await parseJsonBody(req, importAnalyzeRequestSchema);
  const preview = await analizarImportacion(filas);
  return ok(preview);
});
