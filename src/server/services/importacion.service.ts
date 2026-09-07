import { prisma } from "@/lib/db/prisma";
import { registrarHistorial } from "@/server/infrastructure/historial";
import { construirNombreCompleto } from "@/server/domain/persona";
import { TIPOS_UBICACION } from "@/server/domain/ubicaciones";
import { ESTADOS_EXTENSION } from "@/server/domain/extension";
import type {
  ImportPreview,
  ImportRow,
  ImportRowAnalysis,
  ProblemaFila,
} from "@/server/domain/importacion";
import type { Prisma } from "@/generated/prisma/client";

function normalizar(texto: string): string {
  return texto.trim().toLowerCase();
}

function slugify(texto: string): string {
  return (
    texto
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "sin-nombre"
  );
}

function tipoUbicacionValido(valor: string): valor is (typeof TIPOS_UBICACION)[number] {
  return (TIPOS_UBICACION as readonly string[]).includes(valor);
}

function nombrePersonaFila(fila: ImportRow): string | null {
  if (!fila.personaNombre.trim()) return null;
  return construirNombreCompleto({
    nombre: fila.personaNombre,
    apellidoPaterno: fila.personaApellidoPaterno,
    apellidoMaterno: fila.personaApellidoMaterno,
  });
}

// ---------------------------------------------------------------------------
// Análisis / vista previa (no persiste nada)
// ---------------------------------------------------------------------------

/**
 * Analiza y valida un lote sin escribir en la base de datos (spec sección
 * 15: "no importar directamente sin mostrar una vista previa"). Detecta
 * extensiones duplicadas (en el archivo y contra la BD), personas
 * posiblemente duplicadas y campos obligatorios faltantes, para que el
 * administrador revise antes de confirmar.
 */
export async function analizarImportacion(filas: ImportRow[]): Promise<ImportPreview> {
  const numeros = filas.map((f) => f.extension.trim()).filter(Boolean);
  const conteoNumeros = new Map<string, number>();
  for (const n of numeros) conteoNumeros.set(n, (conteoNumeros.get(n) ?? 0) + 1);

  const existentes = await prisma.extension.findMany({
    where: { numero: { in: numeros } },
    select: { numero: true },
  });
  const existentesSet = new Set(existentes.map((e) => e.numero));

  // Dataset de un directorio institucional: cargar personas activas en
  // memoria es más simple y suficientemente rápido que N consultas por fila.
  const personasActivas = await prisma.persona.findMany({
    where: { activo: true },
    select: { nombreCompleto: true },
  });
  const nombresExistentes = new Set(personasActivas.map((p) => normalizar(p.nombreCompleto)));

  const analisis: ImportRowAnalysis[] = filas.map((datos, index) => {
    const problemas: ImportRowAnalysis["problemas"] = [];
    const numero = datos.extension.trim();

    if (!numero) {
      problemas.push({
        tipo: "CAMPO_REQUERIDO_FALTANTE" as ProblemaFila,
        mensaje: "Falta el número de extensión.",
      });
    } else if ((conteoNumeros.get(numero) ?? 0) > 1) {
      problemas.push({
        tipo: "EXTENSION_DUPLICADA_EN_ARCHIVO",
        mensaje: `La extensión ${numero} aparece más de una vez en el archivo.`,
      });
    }

    const existe = numero ? existentesSet.has(numero) : false;
    if (existe) {
      problemas.push({
        tipo: "EXTENSION_YA_EXISTE",
        mensaje: `La extensión ${numero} ya existe: esta fila la actualizará.`,
      });
    }

    const nombrePersona = nombrePersonaFila(datos);
    if (nombrePersona && nombresExistentes.has(normalizar(nombrePersona))) {
      problemas.push({
        tipo: "PERSONA_POSIBLEMENTE_DUPLICADA",
        mensaje: `Ya existe una persona activa llamada "${nombrePersona}"; verifica que no sea un duplicado.`,
      });
    }

    if (datos.ubicacion.trim() && !datos.edificio.trim()) {
      problemas.push({
        tipo: "UBICACION_AMBIGUA",
        mensaje: `"${datos.ubicacion}" no indica edificio: se creará como una ubicación nueva sin edificio asignado.`,
      });
    }

    return {
      fila: index + 1,
      datos,
      accion: existe ? "ACTUALIZAR" : "CREAR",
      problemas,
    };
  });

  return {
    totalFilas: analisis.length,
    filasConProblemas: analisis.filter((a) => a.problemas.length > 0).length,
    filasNuevas: analisis.filter((a) => a.accion === "CREAR").length,
    filasActualizar: analisis.filter((a) => a.accion === "ACTUALIZAR").length,
    filas: analisis,
  };
}

// ---------------------------------------------------------------------------
// Confirmación (persiste, dentro de una sola transacción)
// ---------------------------------------------------------------------------

async function resolverCampus(tx: Prisma.TransactionClient, nombre: string) {
  const nombreTrim = nombre.trim();
  if (!nombreTrim) return null;

  const existente = await tx.campus.findFirst({
    where: { nombre: { equals: nombreTrim, mode: "insensitive" } },
  });
  if (existente) return existente;

  return tx.campus.create({ data: { nombre: nombreTrim, clave: slugify(nombreTrim) } });
}

async function resolverEdificio(
  tx: Prisma.TransactionClient,
  nombre: string,
  campusId: string | null,
) {
  const nombreTrim = nombre.trim();
  if (!nombreTrim || !campusId) return null;

  const existente = await tx.edificio.findFirst({
    where: { campusId, nombre: { equals: nombreTrim, mode: "insensitive" } },
  });
  if (existente) return existente;

  return tx.edificio.create({ data: { campusId, nombre: nombreTrim, clave: slugify(nombreTrim) } });
}

/**
 * Sin edificio identificado NO se reutiliza una ubicación existente con el
 * mismo nombre: dos filas "Cubículo 1" sin edificio pueden ser espacios
 * físicos distintos (spec sección 22) y fusionarlas sería inventar una
 * relación que los datos de origen no confirman. Solo se deduplica cuando
 * el edificio sí se conoce.
 */
async function resolverUbicacion(
  tx: Prisma.TransactionClient,
  fila: ImportRow,
  edificioId: string | null,
) {
  const tipoTexto = fila.tipoUbicacion.trim().toUpperCase();
  const tipo = tipoUbicacionValido(tipoTexto) ? tipoTexto : null;
  const nombre = fila.ubicacion.trim();
  if (!nombre && !tipo) return null;

  const tipoFinal = tipo ?? "OTRO";

  if (edificioId) {
    const existente = await tx.ubicacion.findFirst({
      where: { edificioId, tipo: tipoFinal, nombre: { equals: nombre, mode: "insensitive" } },
    });
    if (existente) return existente;
  }

  return tx.ubicacion.create({
    data: { edificioId, tipo: tipoFinal, nombre: nombre || null },
  });
}

async function resolverArea(
  tx: Prisma.TransactionClient,
  nombreArea: string,
  nombreSubarea: string,
) {
  const areaTrim = nombreArea.trim();
  if (!areaTrim) return null;

  let area = await tx.area.findFirst({
    where: { nombre: { equals: areaTrim, mode: "insensitive" }, areaPadreId: null },
  });
  if (!area) {
    area = await tx.area.create({ data: { nombre: areaTrim } });
  }

  const subareaTrim = nombreSubarea.trim();
  if (!subareaTrim) return area;

  let subarea = await tx.area.findFirst({
    where: { nombre: { equals: subareaTrim, mode: "insensitive" }, areaPadreId: area.id },
  });
  if (!subarea) {
    subarea = await tx.area.create({ data: { nombre: subareaTrim, areaPadreId: area.id } });
  }
  return subarea;
}

async function resolverPuesto(tx: Prisma.TransactionClient, nombre: string) {
  const nombreTrim = nombre.trim();
  if (!nombreTrim) return null;

  const existente = await tx.puesto.findFirst({
    where: { nombre: { equals: nombreTrim, mode: "insensitive" } },
  });
  if (existente) return existente;

  return tx.puesto.create({ data: { nombre: nombreTrim } });
}

/**
 * Busca una persona ya asignada a ESTA extensión con el mismo nombre
 * (re-importar el mismo archivo actualiza en vez de duplicar). Un nombre
 * igual en OTRA extensión no se reutiliza: podría ser una persona distinta
 * (mismo criterio conservador que docs/DATABASE.md aplica a ubicaciones).
 */
async function resolverPersonaDeExtension(
  tx: Prisma.TransactionClient,
  extensionId: string,
  nombreCompleto: string,
  puestoId: string | null,
  areaId: string | null,
) {
  const asignacionExistente = await tx.asignacionExtension.findFirst({
    where: {
      extensionId,
      persona: { nombreCompleto: { equals: nombreCompleto, mode: "insensitive" } },
    },
    include: { persona: true },
  });

  if (asignacionExistente?.persona) {
    return tx.persona.update({
      where: { id: asignacionExistente.persona.id },
      data: { puestoId, areaId },
    });
  }

  return tx.persona.create({
    data: { nombre: nombreCompleto, nombreCompleto, puestoId, areaId },
  });
}

export interface ResultadoImportacion {
  loteId: string;
  creadas: number;
  actualizadas: number;
  omitidas: number;
}

export async function confirmarImportacion(
  filas: ImportRow[],
  usuarioId: string,
): Promise<ResultadoImportacion> {
  const loteId = crypto.randomUUID();
  let creadas = 0;
  let actualizadas = 0;
  let omitidas = 0;

  await prisma.$transaction(
    async (tx) => {
      const extensionesTocadas = new Set<string>();

      for (const fila of filas) {
        const numero = fila.extension.trim();
        if (!numero) {
          omitidas += 1;
          continue;
        }

        const campus = await resolverCampus(tx, fila.campus);
        const edificio = await resolverEdificio(tx, fila.edificio, campus?.id ?? null);
        const ubicacion = await resolverUbicacion(tx, fila, edificio?.id ?? null);
        const area = await resolverArea(tx, fila.area, fila.subarea);
        const puesto = await resolverPuesto(tx, fila.puesto);

        const estado = ESTADOS_EXTENSION.includes(fila.estado as never)
          ? (fila.estado as (typeof ESTADOS_EXTENSION)[number])
          : undefined;

        const extensionAnterior = await tx.extension.findUnique({ where: { numero } });
        const extension = await tx.extension.upsert({
          where: { numero },
          update: { ...(estado ? { estado } : {}), ...(fila.observaciones ? { observaciones: fila.observaciones } : {}) },
          create: {
            numero,
            estado: estado ?? "SIN_ASIGNAR",
            observaciones: fila.observaciones || null,
          },
        });

        await registrarHistorial(tx, {
          entidad: "Extension",
          entidadId: extension.id,
          accion: "IMPORTAR",
          valoresAnteriores: extensionAnterior,
          valoresNuevos: extension,
          usuarioId,
          loteId,
        });
        if (extensionAnterior) {
          actualizadas += 1;
        } else {
          creadas += 1;
        }
        extensionesTocadas.add(extension.id);

        const nombrePersona = nombrePersonaFila(fila);
        if (nombrePersona) {
          const persona = await resolverPersonaDeExtension(
            tx,
            extension.id,
            nombrePersona,
            puesto?.id ?? null,
            area?.id ?? null,
          );

          const asignacionExistente = await tx.asignacionExtension.findFirst({
            where: { extensionId: extension.id, personaId: persona.id },
          });

          if (asignacionExistente) {
            await tx.asignacionExtension.update({
              where: { id: asignacionExistente.id },
              data: {
                activo: true,
                fechaFin: null,
                areaId: area?.id ?? null,
                ubicacionId: ubicacion?.id ?? null,
              },
            });
          } else {
            const nueva = await tx.asignacionExtension.create({
              data: {
                extensionId: extension.id,
                personaId: persona.id,
                areaId: area?.id ?? null,
                ubicacionId: ubicacion?.id ?? null,
                tipoAsignacion: "INDIVIDUAL",
              },
            });
            await registrarHistorial(tx, {
              entidad: "AsignacionExtension",
              entidadId: nueva.id,
              accion: "IMPORTAR",
              valoresNuevos: nueva,
              usuarioId,
              loteId,
            });
          }
        } else if (area || ubicacion) {
          // Sin persona pero con área/ubicación: extensión de área o
          // servicio (spec sección 22, p. ej. Cafetería, SITE).
          const asignacionExistente = await tx.asignacionExtension.findFirst({
            where: { extensionId: extension.id, personaId: null },
          });
          if (!asignacionExistente) {
            const nueva = await tx.asignacionExtension.create({
              data: {
                extensionId: extension.id,
                areaId: area?.id ?? null,
                ubicacionId: ubicacion?.id ?? null,
                tipoAsignacion: "AREA_SERVICIO",
              },
            });
            await registrarHistorial(tx, {
              entidad: "AsignacionExtension",
              entidadId: nueva.id,
              accion: "IMPORTAR",
              valoresNuevos: nueva,
              usuarioId,
              loteId,
            });
          }
        }
      }

      // Reclasifica tipoAsignacion según cuántas asignaciones activas quedan
      // por extensión: 1 persona = Individual, 2+ = Compartida (spec 24).
      for (const extensionId of extensionesTocadas) {
        const activas = await tx.asignacionExtension.findMany({
          where: { extensionId, activo: true, personaId: { not: null } },
        });
        if (activas.length >= 2) {
          await tx.asignacionExtension.updateMany({
            where: { id: { in: activas.map((a) => a.id) } },
            data: { tipoAsignacion: "COMPARTIDA" },
          });
        } else if (activas.length === 1 && activas[0].tipoAsignacion !== "INDIVIDUAL") {
          await tx.asignacionExtension.update({
            where: { id: activas[0].id },
            data: { tipoAsignacion: "INDIVIDUAL" },
          });
        }

        const estadoActual = await tx.extension.findUnique({
          where: { id: extensionId },
          select: { estado: true },
        });
        const tieneAsignaciones = await tx.asignacionExtension.count({
          where: { extensionId, activo: true },
        });
        if (estadoActual?.estado === "SIN_ASIGNAR" && tieneAsignaciones > 0) {
          await tx.extension.update({ where: { id: extensionId }, data: { estado: "ACTIVA" } });
        }
      }
    },
    // Cada fila hace varias consultas secuenciales (resolver campus,
    // edificio, ubicación, área, puesto, persona…) contra Neon; con
    // archivos grandes el total supera fácilmente el timeout por defecto
    // de las transacciones interactivas de Prisma (5s) o incluso 60s.
    { timeout: 300_000, maxWait: 30_000 },
  );

  return { loteId, creadas, actualizadas, omitidas };
}
