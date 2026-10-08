import { describe, expect, it, vi } from "vitest";
import { prismaMock } from "@/test/prisma-mock";
import { registrarBusqueda } from "@/server/services/metricas.service";

describe("registrarBusqueda", () => {
  it("normaliza el texto (trim + minúsculas) antes de guardarlo", async () => {
    prismaMock.busquedaLog.create.mockResolvedValue({} as never);

    await registrarBusqueda("  Calidad Académica  ", 3);

    expect(prismaMock.busquedaLog.create).toHaveBeenCalledWith({
      data: { texto: "calidad académica", resultados: 3 },
    });
  });

  it("no lanza si falla el registro — nunca debe tumbar la búsqueda real", async () => {
    prismaMock.busquedaLog.create.mockRejectedValue(new Error("db caída"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(registrarBusqueda("5125", 1)).resolves.toBeUndefined();
  });
});
