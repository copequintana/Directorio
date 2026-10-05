import type { NextRequest } from "next/server";
import { ok, withApiErrors, ServiceError } from "@/lib/api-response";
import { obtenerMapaCampus } from "@/server/services/ubicaciones.service";

type Params = { params: Promise<{ id: string }> };

// Público: el mapa del campus es parte del directorio público, igual que la
// búsqueda (spec sección 9.1).
export const GET = withApiErrors(async (_req: NextRequest, { params }: Params) => {
  const { id } = await params;
  const campus = await obtenerMapaCampus(id);
  if (!campus) throw new ServiceError(404, "Campus no encontrado.");
  return ok(campus);
});
