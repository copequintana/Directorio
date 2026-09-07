import type { NextRequest } from "next/server";
import type { ZodType, z } from "zod";

export function parseSearchParams<S extends ZodType>(
  req: NextRequest,
  schema: S,
): z.infer<S> {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  return schema.parse(params);
}

export async function parseJsonBody<S extends ZodType>(
  req: NextRequest,
  schema: S,
): Promise<z.infer<S>> {
  const body = await req.json().catch(() => ({}));
  return schema.parse(body);
}
