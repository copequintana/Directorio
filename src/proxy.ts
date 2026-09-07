import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

// Instancia "edge-safe" (sin el Credentials provider — ver auth.config.ts):
// el proxy solo necesita leer/verificar el JWT de la cookie de sesión, no
// autenticar, así que no necesita Prisma ni bcrypt.
const { auth } = NextAuth(authConfig);

// Protege /admin/** a nivel de borde: sin sesión, redirige a /login. Esto es
// solo la primera línea de defensa (UX) — cada mutación en /api/** vuelve a
// validar sesión y rol en el servidor (server/infrastructure/auth-guard.ts)
// porque un proxy no debe ser el único punto de autorización.
export default auth((req) => {
  const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");
  if (isAdminRoute && !req.auth) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"],
};
