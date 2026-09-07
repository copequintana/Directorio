import type { DefaultSession } from "next-auth";
import type { RolUsuario } from "@/server/domain/usuario";

declare module "next-auth" {
  interface User {
    rol: RolUsuario;
  }

  interface Session {
    user: {
      id: string;
      rol: RolUsuario;
    } & DefaultSession["user"];
  }
}

// "next-auth/jwt" solo re-exporta desde "@auth/core/jwt" (donde vive la
// declaración real de JWT): el augment tiene que apuntar ahí para que el
// merge de tipos de TypeScript lo reconozca.
declare module "@auth/core/jwt" {
  interface JWT {
    rol: RolUsuario;
  }
}
