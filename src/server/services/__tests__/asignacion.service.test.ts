import { describe, expect, it } from "vitest";
import { prismaMock } from "@/test/prisma-mock";
import { crearAsignacion, eliminarAsignacion } from "@/server/services/asignacion.service";
import { ServiceError } from "@/server/infrastructure/errors";

const USUARIO_ID = "usuario-1";
const EXTENSION_BASE = {
  id: "ext-1",
  numero: "5215",
  tipo: null,
  observaciones: null,
  activo: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("crearAsignacion", () => {
  it("permite una extensión sin persona (spec 6.2 / 22 — p.ej. SITE)", async () => {
    prismaMock.extension.findUnique.mockResolvedValue({ ...EXTENSION_BASE, estado: "SIN_ASIGNAR" });
    prismaMock.asignacionExtension.create.mockResolvedValue({
      id: "asig-1",
      extensionId: "ext-1",
      personaId: null,
      areaId: null,
      ubicacionId: "ubicacion-site",
      tipoAsignacion: "SIN_PERSONA",
      fechaInicio: new Date(),
      fechaFin: null,
      esPrincipal: true,
      activo: true,
      observaciones: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const asignacion = await crearAsignacion(
      "ext-1",
      { personaId: null, areaId: null, ubicacionId: "ubicacion-site", tipoAsignacion: "SIN_PERSONA", esPrincipal: true },
      USUARIO_ID,
    );

    expect(asignacion.personaId).toBeNull();
    expect(prismaMock.persona.findUnique).not.toHaveBeenCalled();
  });

  it("permite una extensión compartida por varias personas (spec 6.3 / 24)", async () => {
    prismaMock.extension.findUnique.mockResolvedValue({ ...EXTENSION_BASE, estado: "ACTIVA" });
    prismaMock.persona.findUnique.mockResolvedValue({
      id: "persona-2",
      nombre: "Elvia",
      apellidoPaterno: null,
      apellidoMaterno: null,
      nombreCompleto: "Elvia",
      correo: null,
      puestoId: null,
      areaId: null,
      activo: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prismaMock.asignacionExtension.create.mockResolvedValue({
      id: "asig-2",
      extensionId: "ext-1",
      personaId: "persona-2",
      areaId: null,
      ubicacionId: null,
      tipoAsignacion: "COMPARTIDA",
      fechaInicio: new Date(),
      fechaFin: null,
      esPrincipal: false,
      activo: true,
      observaciones: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const asignacion = await crearAsignacion(
      "ext-1",
      { personaId: "persona-2", tipoAsignacion: "COMPARTIDA", esPrincipal: false },
      USUARIO_ID,
    );

    expect(asignacion.tipoAsignacion).toBe("COMPARTIDA");
    expect(prismaMock.asignacionExtension.updateMany).not.toHaveBeenCalled();
  });

  it("rechaza asignar a una extensión inexistente", async () => {
    prismaMock.extension.findUnique.mockResolvedValue(null);
    await expect(
      crearAsignacion("no-existe", { esPrincipal: true, tipoAsignacion: "INDIVIDUAL" }, USUARIO_ID),
    ).rejects.toThrow(ServiceError);
  });
});

describe("eliminarAsignacion", () => {
  it("finaliza la asignación (fechaFin) sin borrarla, para conservar el historial", async () => {
    const asignacionExistente = {
      id: "asig-1",
      extensionId: "ext-1",
      personaId: "persona-1",
      areaId: null,
      ubicacionId: null,
      tipoAsignacion: "INDIVIDUAL" as const,
      fechaInicio: new Date(),
      fechaFin: null,
      esPrincipal: true,
      activo: true,
      observaciones: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    prismaMock.asignacionExtension.findUnique.mockResolvedValue(asignacionExistente);
    prismaMock.asignacionExtension.update.mockResolvedValue({
      ...asignacionExistente,
      activo: false,
      fechaFin: new Date(),
    });
    prismaMock.asignacionExtension.count.mockResolvedValue(0);
    prismaMock.extension.findUnique.mockResolvedValue({ ...EXTENSION_BASE, estado: "ACTIVA" });

    await eliminarAsignacion("ext-1", "asig-1", USUARIO_ID);

    expect(prismaMock.asignacionExtension.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ activo: false }) }),
    );
    expect(prismaMock.extension.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { estado: "SIN_ASIGNAR" } }),
    );
  });
});
