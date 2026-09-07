import { describe, expect, it } from "vitest";
import { prismaMock } from "@/test/prisma-mock";
import { crearPersona } from "@/server/services/persona.service";

const USUARIO_ID = "usuario-1";

describe("crearPersona", () => {
  it("crea una persona y compone nombreCompleto a partir de nombre/apellidos", async () => {
    prismaMock.persona.create.mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (async (args: any) => ({
        id: "persona-1",
        apellidoPaterno: null,
        apellidoMaterno: null,
        correo: null,
        puestoId: null,
        areaId: null,
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...args.data,
      })) as typeof prismaMock.persona.create,
    );

    const persona = await crearPersona(
      { nombre: "Dulce Guadalupe", apellidoPaterno: "Corral", apellidoMaterno: "Leyva", activo: true },
      USUARIO_ID,
    );

    expect(persona.nombreCompleto).toBe("Dulce Guadalupe Corral Leyva");
    expect(prismaMock.historialCambios.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ accion: "CREAR", entidad: "Persona" }) }),
    );
  });
});
