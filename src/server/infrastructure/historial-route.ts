import type { NextRequest } from "next/server";
import { ok, withApiErrors } from "@/lib/api-response";
import { obtenerHistorialEntidad } from "@/server/services/historial.service";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/{entidad}/{id}/historial (spec sección 17) es el mismo
 * comportamiento para todas las entidades — una sola fábrica evita repetir
 * el mismo route handler 6 veces.
 */
export function createHistorialHandler(entidad: string) {
  return withApiErrors(async (_req: NextRequest, { params }: Params) => {
    const { id } = await params;
    const historial = await obtenerHistorialEntidad(entidad, id);
    return ok(historial);
  });
}
