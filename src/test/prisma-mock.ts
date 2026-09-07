import { beforeEach, vi } from "vitest";
import { mockDeep, mockReset, type DeepMockProxy } from "vitest-mock-extended";
import type { PrismaClient } from "@/generated/prisma/client";

// Mockea el singleton de Prisma para que los tests de servicios corran sin
// una base de datos real. $transaction se resuelve invocando el callback
// con el mismo mock (los servicios siempre reciben `tx` así), de modo que
// las expectativas se hacen sobre las mismas llamadas mockeadas.
vi.mock("@/lib/db/prisma", () => ({
  prisma: mockDeep<PrismaClient>(),
}));

const { prisma } = await import("@/lib/db/prisma");
export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

beforeEach(() => {
  mockReset(prismaMock);
  prismaMock.$transaction.mockImplementation(async (arg: unknown) => {
    if (typeof arg === "function") {
      return (arg as (tx: typeof prismaMock) => unknown)(prismaMock);
    }
    return Promise.all(arg as Promise<unknown>[]);
  });
});
