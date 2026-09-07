import { describe, expect, it } from "vitest";
import { prismaMock } from "@/test/prisma-mock";
import { buscarDirectorio } from "@/server/services/search.service";

describe("buscarDirectorio", () => {
  it("busca por número de extensión (spec 7)", async () => {
    prismaMock.extension.findMany.mockResolvedValue([]);
    prismaMock.extension.count.mockResolvedValue(0);

    await buscarDirectorio({ q: "5125", page: 1, pageSize: 20 });

    const llamada = prismaMock.extension.findMany.mock.calls[0][0];
    expect(llamada?.where?.OR).toContainEqual(
      expect.objectContaining({ numero: { contains: "5125", mode: "insensitive" } }),
    );
  });

  it("busca por nombre de persona a través de las asignaciones activas", async () => {
    prismaMock.extension.findMany.mockResolvedValue([]);
    prismaMock.extension.count.mockResolvedValue(0);

    await buscarDirectorio({ q: "Corral", page: 1, pageSize: 20 });

    const llamada = prismaMock.extension.findMany.mock.calls[0][0];
    const filtroAsignaciones = llamada?.where?.OR?.find(
      (clausula) => "asignaciones" in clausula,
    );
    expect(filtroAsignaciones).toBeTruthy();
  });

  it("filtra por área (filtro estructurado, no texto libre)", async () => {
    prismaMock.extension.findMany.mockResolvedValue([]);
    prismaMock.extension.count.mockResolvedValue(0);

    await buscarDirectorio({ q: "", areaId: "area-calidad", page: 1, pageSize: 20 });

    const llamada = prismaMock.extension.findMany.mock.calls[0][0];
    expect(llamada?.where?.asignaciones).toEqual(
      expect.objectContaining({ some: expect.objectContaining({ areaId: "area-calidad" }) }),
    );
  });
});
