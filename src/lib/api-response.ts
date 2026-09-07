import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthError } from "@/server/infrastructure/auth-guard";
import { ServiceError } from "@/server/infrastructure/errors";

export { ServiceError };

/** Sobre estándar de respuesta de la API (spec sección 18). */
export function ok<T>(data: T, init?: { status?: number; message?: string | null }) {
  return NextResponse.json(
    { success: true, data, message: init?.message ?? null },
    { status: init?.status ?? 200 },
  );
}

export function fail(message: string, init?: { status?: number; errors?: unknown[] }) {
  return NextResponse.json(
    { success: false, data: null, message, errors: init?.errors ?? [] },
    { status: init?.status ?? 400 },
  );
}

/**
 * Envuelve el cuerpo de un route handler para traducir cualquier error
 * esperado (validación, negocio, autenticación/autorización) al sobre
 * estándar en lugar de repetir try/catch en cada endpoint.
 */
export function withApiErrors<T extends unknown[]>(
  fn: (...args: T) => Promise<NextResponse>,
): (...args: T) => Promise<NextResponse> {
  return async (...args: T) => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof ZodError) {
        return fail("Los datos enviados no son válidos.", {
          status: 400,
          errors: error.issues,
        });
      }
      if (error instanceof AuthError) {
        return fail(error.message, { status: error.status });
      }
      if (error instanceof ServiceError) {
        return fail(error.message, { status: error.status, errors: error.errors });
      }

      console.error(error);
      return fail("Ocurrió un error inesperado en el servidor.", { status: 500 });
    }
  };
}
