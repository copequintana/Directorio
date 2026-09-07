import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/generated/prisma/client";

// Singleton de PrismaClient. En desarrollo, Next.js recarga módulos con cada
// cambio de archivo (HMR); sin este patrón cada recarga crearía un nuevo
// PrismaClient (y con él, un nuevo pool de conexiones hacia Neon) hasta
// agotar el límite de conexiones. Guardamos la instancia en `globalThis`
// para reutilizarla entre recargas.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL no está definida. Copia .env.example a .env y configura la cadena de conexión (pooled) de Neon.",
    );
  }

  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
