import type { NextRequest } from "next/server";
import { ok, withApiErrors, ServiceError } from "@/lib/api-response";
import { requireRole } from "@/server/infrastructure/auth-guard";
import { parseArchivoImportacion } from "@/lib/import-parsing";
import { analizarImportacion } from "@/server/services/importacion.service";

export const maxDuration = 120;

// Recibe el archivo .xlsx/.csv tal cual lo sube el navegador (multipart/form-
// data), lo convierte al formato normalizado (spec sección 16) y devuelve la
// vista previa junto con las filas ya estructuradas — el cliente reenvía
// esas mismas filas a /api/importaciones/confirmar sin tener que volver a
// subir el archivo.
export const POST = withApiErrors(async (req: NextRequest) => {
  await requireRole("CAPTURISTA");

  const formData = await req.formData();
  const archivo = formData.get("file");
  if (!(archivo instanceof File)) {
    throw new ServiceError(400, "No se recibió ningún archivo.");
  }

  const filas = await parseArchivoImportacion(archivo);
  if (filas.length === 0) {
    throw new ServiceError(400, "El archivo no contiene filas de datos.");
  }

  const preview = await analizarImportacion(filas);
  return ok({ filas, preview });
});
