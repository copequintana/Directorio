import type { NextRequest } from "next/server";
import { ok, fail, withApiErrors } from "@/lib/api-response";
import { parseSearchParams } from "@/lib/api-request";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { searchQuerySchema } from "@/server/domain/search";
import { buscarDirectorio } from "@/server/services/search.service";

// Público y sin autenticación: 60 solicitudes / 10s por IP alcanza de sobra
// para uso normal (el buscador dispara una por tecleo con debounce) y
// frena un flood scripteado. Ver src/lib/rate-limit.ts.
export const GET = withApiErrors(async (req: NextRequest) => {
  const { allowed, retryAfterSeconds } = rateLimit(`search:${clientIp(req)}`, 60, 10_000);
  if (!allowed) {
    return fail("Demasiadas búsquedas seguidas. Intenta de nuevo en unos segundos.", {
      status: 429,
      errors: [{ retryAfterSeconds }],
    });
  }

  const query = parseSearchParams(req, searchQuerySchema);
  const resultado = await buscarDirectorio(query);
  return ok(resultado);
});
