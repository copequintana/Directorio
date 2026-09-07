/**
 * Error de negocio/validación de la capa de servicios (Application layer).
 * Vive separado de lib/api-response.ts a propósito: ese módulo también
 * importa AuthError (que arrastra next-auth) para withApiErrors, y los
 * servicios no deberían depender transitivamente de next-auth solo por
 * lanzar un ServiceError — entre otras cosas, eso rompía los tests
 * unitarios de servicios al correr fuera del runtime de Next.js.
 */
export class ServiceError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors: unknown[] = [],
  ) {
    super(message);
  }
}
