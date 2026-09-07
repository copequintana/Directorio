import type { NextAuthConfig } from "next-auth";

/**
 * Config "edge-safe": sin el Credentials provider (que necesita Prisma y
 * bcrypt, ambos solo-Node). El proxy/middleware la usa tal cual —
 * únicamente para verificar si existe una sesión válida y redirigir a
 * /login— mientras que src/auth.ts la extiende agregando el provider real
 * para las rutas API y Server Components donde sí corre en runtime Node.
 * Sin este split, importar el provider en el proxy arrastra Prisma a un
 * runtime que no soporta módulos nativos de Node (node:path, node:url).
 */
export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.rol = user.rol;
      }
      return token;
    },
    session: ({ session, token }) => {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.rol = token.rol;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
