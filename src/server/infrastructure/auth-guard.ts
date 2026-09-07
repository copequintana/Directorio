import { auth } from "@/auth";
import { JERARQUIA_ROLES, type RolUsuario } from "@/server/domain/usuario";

export class AuthError extends Error {
  constructor(
    public status: 401 | 403,
    message: string,
  ) {
    super(message);
  }
}

export interface SesionActual {
  usuarioId: string;
  nombre: string;
  correo: string;
  rol: RolUsuario;
}

/**
 * Verifica sesión y rol mínimo en el servidor (defensa en profundidad: el
 * middleware ya protege las rutas /admin/**, pero cada mutación de la API
 * vuelve a validarlo aquí porque los endpoints pueden invocarse
 * directamente). Lanza AuthError si no se cumple, que las rutas traducen a
 * una respuesta 401/403 con el sobre estándar de la API.
 */
export async function requireRole(rolMinimo: RolUsuario): Promise<SesionActual> {
  const session = await auth();
  if (!session?.user) {
    throw new AuthError(401, "Se requiere iniciar sesión.");
  }

  const rol = session.user.rol;
  if (JERARQUIA_ROLES[rol] < JERARQUIA_ROLES[rolMinimo]) {
    throw new AuthError(403, "No tienes permisos suficientes para esta acción.");
  }

  return {
    usuarioId: session.user.id,
    nombre: session.user.name ?? "",
    correo: session.user.email ?? "",
    rol,
  };
}
