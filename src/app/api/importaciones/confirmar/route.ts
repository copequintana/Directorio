import type { NextRequest } from "next/server";
import { ok, withApiErrors } from "@/lib/api-response";
import { parseJsonBody } from "@/lib/api-request";
import { requireRole } from "@/server/infrastructure/auth-guard";
import { importConfirmRequestSchema } from "@/server/domain/importacion";
import { confirmarImportacion } from "@/server/services/importacion.service";

// Archivos grandes hacen muchas consultas secuenciales contra Neon y
// pueden tardar más que el límite por defecto de una función de Vercel.
// Ajusta esto (y el plan de Vercel, si hace falta) según el tamaño real de
// los archivos que importes — ver docs/DEPLOYMENT.md.
export const maxDuration = 300;

// Persiste el lote aprobado por el administrador en una sola transacción
// (spec sección 29 fase 4: "importación transaccional") y devuelve un
// loteId para poder consultarlo luego en GET /api/importaciones/{id}.
export const POST = withApiErrors(async (req: NextRequest) => {
  const sesion = await requireRole("CAPTURISTA");
  const { filas } = await parseJsonBody(req, importConfirmRequestSchema);
  const resultado = await confirmarImportacion(filas, sesion.usuarioId);
  return ok(resultado, { status: 201 });
});
