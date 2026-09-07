import { describe, expect, it } from "vitest";
import { prismaMock } from "@/test/prisma-mock";
import {
  crearExtension,
  desactivarExtension,
} from "@/server/services/extension.service";
import { ServiceError } from "@/server/infrastructure/errors";

const USUARIO_ID = "usuario-1";

describe("crearExtension", () => {
  it("crea una extensión cuando el número no existe (spec 6.1)", async () => {
    prismaMock.extension.findUnique.mockResolvedValue(null);
    prismaMock.extension.create.mockResolvedValue({
      id: "ext-1",
      numero: "5125",
      tipo: null,
      estado: "SIN_ASIGNAR",
      observaciones: null,
      activo: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const extension = await crearExtension({ numero: "5125", estado: "SIN_ASIGNAR", activo: true }, USUARIO_ID);

    expect(extension.numero).toBe("5125");
    expect(prismaMock.historialCambios.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ accion: "CREAR", entidad: "Extension" }) }),
    );
  });

  it("rechaza una extensión duplicada (spec 6.1)", async () => {
    prismaMock.extension.findUnique.mockResolvedValue({
      id: "ext-existente",
      numero: "5125",
      tipo: null,
      estado: "ACTIVA",
      observaciones: null,
      activo: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      crearExtension({ numero: "5125", estado: "SIN_ASIGNAR", activo: true }, USUARIO_ID),
    ).rejects.toThrow(ServiceError);
    expect(prismaMock.extension.create).not.toHaveBeenCalled();
  });
});

describe("desactivarExtension", () => {
  it("desactiva lógicamente en vez de borrar (spec 6.5-6.6)", async () => {
    prismaMock.extension.findUnique.mockResolvedValue({
      id: "ext-1",
      numero: "5125",
      tipo: null,
      estado: "ACTIVA",
      observaciones: null,
      activo: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prismaMock.extension.update.mockResolvedValue({
      id: "ext-1",
      numero: "5125",
      tipo: null,
      estado: "INACTIVA",
      observaciones: null,
      activo: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const resultado = await desactivarExtension("ext-1", USUARIO_ID);

    expect(prismaMock.extension.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ activo: false }) }),
    );
    expect(resultado.activo).toBe(false);
    expect(prismaMock.historialCambios.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ accion: "DESACTIVAR" }) }),
    );
  });

  it("lanza 404 si la extensión no existe", async () => {
    prismaMock.extension.findUnique.mockResolvedValue(null);
    await expect(desactivarExtension("no-existe", USUARIO_ID)).rejects.toThrow(ServiceError);
  });
});
