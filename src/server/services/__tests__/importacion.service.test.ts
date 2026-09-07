import { describe, expect, it } from "vitest";
import { prismaMock } from "@/test/prisma-mock";
import { analizarImportacion, confirmarImportacion } from "@/server/services/importacion.service";
import { importRowSchema } from "@/server/domain/importacion";

function fila(datos: Partial<Parameters<typeof importRowSchema.parse>[0]>) {
  return importRowSchema.parse({ extension: "", ...datos });
}

describe("analizarImportacion", () => {
  it("detecta extensiones duplicadas dentro del mismo archivo", async () => {
    prismaMock.extension.findMany.mockResolvedValue([]);
    prismaMock.persona.findMany.mockResolvedValue([]);

    const preview = await analizarImportacion([
      fila({ extension: "5125", personaNombre: "Dulce" }),
      fila({ extension: "5125", personaNombre: "Otra Persona" }),
    ]);

    expect(preview.filas[0].problemas.map((p) => p.tipo)).toContain("EXTENSION_DUPLICADA_EN_ARCHIVO");
  });

  it("marca como ACTUALIZAR cuando la extensión ya existe en la base de datos", async () => {
    prismaMock.extension.findMany.mockResolvedValue([{ numero: "5125" } as never]);
    prismaMock.persona.findMany.mockResolvedValue([]);

    const preview = await analizarImportacion([fila({ extension: "5125" })]);

    expect(preview.filas[0].accion).toBe("ACTUALIZAR");
    expect(preview.filas[0].problemas.map((p) => p.tipo)).toContain("EXTENSION_YA_EXISTE");
  });

  it("marca campo requerido faltante cuando no hay número de extensión", async () => {
    prismaMock.extension.findMany.mockResolvedValue([]);
    prismaMock.persona.findMany.mockResolvedValue([]);

    const preview = await analizarImportacion([fila({ extension: "" })]);

    expect(preview.filas[0].problemas.map((p) => p.tipo)).toContain("CAMPO_REQUERIDO_FALTANTE");
  });
});

describe("confirmarImportacion", () => {
  it("importa un registro nuevo y lo deja auditado con accion IMPORTAR", async () => {
    prismaMock.campus.findFirst.mockResolvedValue(null);
    prismaMock.edificio.findFirst.mockResolvedValue(null);
    prismaMock.ubicacion.findFirst.mockResolvedValue(null);
    prismaMock.area.findFirst.mockResolvedValue(null);
    prismaMock.puesto.findFirst.mockResolvedValue(null);
    prismaMock.extension.findUnique.mockResolvedValue(null);
    prismaMock.extension.upsert.mockResolvedValue({
      id: "ext-1",
      numero: "5470",
      tipo: null,
      estado: "SIN_ASIGNAR",
      observaciones: null,
      activo: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prismaMock.asignacionExtension.findFirst.mockResolvedValue(null);
    prismaMock.persona.create.mockResolvedValue({
      id: "persona-1",
      nombre: "Bárbara Machado Borrell",
      apellidoPaterno: null,
      apellidoMaterno: null,
      nombreCompleto: "Bárbara Machado Borrell",
      correo: null,
      puestoId: null,
      areaId: null,
      activo: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prismaMock.asignacionExtension.create.mockResolvedValue({
      id: "asig-1",
      extensionId: "ext-1",
      personaId: "persona-1",
      areaId: null,
      ubicacionId: null,
      tipoAsignacion: "INDIVIDUAL",
      fechaInicio: new Date(),
      fechaFin: null,
      esPrincipal: true,
      activo: true,
      observaciones: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prismaMock.asignacionExtension.findMany.mockResolvedValue([
      { id: "asig-1", tipoAsignacion: "INDIVIDUAL" } as never,
    ]);
    prismaMock.extension.findUnique.mockResolvedValueOnce(null).mockResolvedValue({
      id: "ext-1",
      numero: "5470",
      tipo: null,
      estado: "SIN_ASIGNAR",
      observaciones: null,
      activo: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const resultado = await confirmarImportacion(
      [fila({ extension: "5470", personaNombre: "Bárbara Machado Borrell" })],
      "usuario-1",
    );

    expect(resultado.creadas).toBe(1);
    expect(prismaMock.historialCambios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ accion: "IMPORTAR", entidad: "Extension", loteId: resultado.loteId }),
      }),
    );
  });
});
