import type { NextRequest } from "next/server";
import { ok, withApiErrors } from "@/lib/api-response";
import { parseSearchParams } from "@/lib/api-request";
import { searchQuerySchema } from "@/server/domain/search";
import { buscarDirectorio } from "@/server/services/search.service";

export const GET = withApiErrors(async (req: NextRequest) => {
  const query = parseSearchParams(req, searchQuerySchema);
  const resultado = await buscarDirectorio(query);
  return ok(resultado);
});
