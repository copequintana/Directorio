import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
import { loginSchema } from "@/server/domain/usuario";
import { autenticarUsuario } from "@/server/services/usuario.service";

// Config completa (con el Credentials provider real, que sí necesita
// Prisma/bcrypt): se usa en rutas API y Server Components, que corren en
// runtime Node. El proxy (src/proxy.ts) usa la variante "edge-safe" en
// auth.config.ts en su lugar — ver el comentario ahí para el porqué.
//
// Cuando exista autenticación institucional (spec 5.9: "preferir
// integración institucional si posteriormente se dispone de ella") se puede
// agregar aquí un proveedor OIDC/SAML adicional sin tocar el resto de la app.
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        correo: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const usuario = await autenticarUsuario(parsed.data.correo, parsed.data.password);
        if (!usuario) return null;

        return {
          id: usuario.id,
          name: usuario.nombre,
          email: usuario.correo,
          rol: usuario.rol,
        };
      },
    }),
  ],
});
