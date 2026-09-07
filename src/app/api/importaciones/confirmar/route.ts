import type { NextRequest } from "next/server";
import { ok, withApiErrors } from "@/lib/api-response";
import { parseJsonBody } from "@/lib/api-request";
import { requireRole } from "@/server/infrastructure/auth-guard";
import { importConfirmRequestSchema } from "@/server/domain/importacion";
import { confirmarImportacion } from "@/server/services/importacion.service";

// Persiste el lote aprobado por el administrador en una sola transacción
// (spec sección 29 fase 4: "importación transaccional") y devuelve un
// loteId para poder consultarlo luego en GET /api/importaciones/{id}.
export const POST = withApiErrors(async (req: NextRequest) => {
  const sesion = await requireRole("CAPTURISTA");
  const { filas } = await parseJsonBody(req, importConfirmRequestSchema);
  const resultado = await confirmarImportacion(filas, sesion.usuarioId);
  return ok(resultado, { status: 201 });
});
