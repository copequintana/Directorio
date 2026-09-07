import { prisma } from "@/lib/db/prisma";
import type { SearchQuery, SearchResultItem } from "@/server/domain/search";
import type { Prisma } from "@/generated/prisma/client";

const INCLUDE = {
  asignaciones: {
    where: { activo: true },
    include: {
      persona: { include: { puesto: true } },
      area: true,
      ubicacion: { include: { edificio: { include: { campus: true } } } },
    },
    orderBy: [{ esPrincipal: "desc" as const }, { createdAt: "asc" as const }],
  },
} satisfies Prisma.ExtensionInclude;

/**
 * Búsqueda libre entre extensión, persona(s), área, puesto, ubicación,
 * edificio, campus y observaciones (spec sección 7). Estrategia elegida
 * para el MVP: una sola consulta de Prisma con filtros OR sobre relaciones
 * anidadas — es suficiente para el volumen de un directorio institucional
 * (cientos/pocos miles de extensiones). Si el volumen crece de forma
 * relevante, la ruta de mejora documentada en docs/DATABASE.md es agregar
 * una columna `tsvector` + índice GIN y mover esta función a `$queryRaw`.
 */
export async function buscarDirectorio(filtros: SearchQuery) {
  const q = filtros.q.trim();

  const filtroTexto: Prisma.ExtensionWhereInput[] = q
    ? [
        { numero: { contains: q, mode: "insensitive" } },
        { observaciones: { contains: q, mode: "insensitive" } },
        {
          asignaciones: {
            some: {
              activo: true,
              OR: [
                { persona: { nombreCompleto: { contains: q, mode: "insensitive" } } },
                { persona: { nombre: { contains: q, mode: "insensitive" } } },
                { persona: { apellidoPaterno: { contains: q, mode: "insensitive" } } },
                { persona: { apellidoMaterno: { contains: q, mode: "insensitive" } } },
                { persona: { puesto: { nombre: { contains: q, mode: "insensitive" } } } },
                { area: { nombre: { contains: q, mode: "insensitive" } } },
                { persona: { area: { nombre: { contains: q, mode: "insensitive" } } } },
                { ubicacion: { nombre: { contains: q, mode: "insensitive" } } },
                { ubicacion: { numero: { contains: q, mode: "insensitive" } } },
                { ubicacion: { descripcion: { contains: q, mode: "insensitive" } } },
                { ubicacion: { edificio: { nombre: { contains: q, mode: "insensitive" } } } },
                {
                  ubicacion: {
                    edificio: { campus: { nombre: { contains: q, mode: "insensitive" } } },
                  },
                },
              ],
            },
          },
        },
      ]
    : [];

  const ubicacionFiltro: Prisma.UbicacionWhereInput = {};
  if (filtros.edificioId) ubicacionFiltro.edificioId = filtros.edificioId;
  if (filtros.campusId) ubicacionFiltro.edificio = { campusId: filtros.campusId };

  const filtroRelacion: Prisma.AsignacionExtensionWhereInput = {
    activo: true,
    ...(filtros.areaId ? { areaId: filtros.areaId } : {}),
    ...(filtros.ubicacionId ? { ubicacionId: filtros.ubicacionId } : {}),
    ...(Object.keys(ubicacionFiltro).length > 0 ? { ubicacion: ubicacionFiltro } : {}),
  };
  const requiereFiltroRelacion =
    !!filtros.areaId || !!filtros.ubicacionId || !!filtros.edificioId || !!filtros.campusId;

  const where: Prisma.ExtensionWhereInput = {
    activo: true,
    ...(filtros.estado ? { estado: filtros.estado } : {}),
    ...(q ? { OR: filtroTexto } : {}),
    ...(requiereFiltroRelacion ? { asignaciones: { some: filtroRelacion } } : {}),
  };

  const [extensiones, total] = await Promise.all([
    prisma.extension.findMany({
      where,
      include: INCLUDE,
      orderBy: { numero: "asc" },
      skip: (filtros.page - 1) * filtros.pageSize,
      take: filtros.pageSize,
    }),
    prisma.extension.count({ where }),
  ]);

  const items: SearchResultItem[] = extensiones.map((ext) => {
    const principal = ext.asignaciones[0];
    const personasActivas = ext.asignaciones
      .filter((a) => a.persona)
      .map((a) => ({ id: a.persona!.id, nombreCompleto: a.persona!.nombreCompleto }));
    const personaConPuesto = ext.asignaciones.find((a) => a.persona?.puesto)?.persona ?? null;

    return {
      extensionId: ext.id,
      numero: ext.numero,
      estado: ext.estado,
      observaciones: ext.observaciones,
      personas: personasActivas,
      area: principal?.area ? { id: principal.area.id, nombre: principal.area.nombre } : null,
      puesto: personaConPuesto?.puesto
        ? { id: personaConPuesto.puesto.id, nombre: personaConPuesto.puesto.nombre }
        : null,
      ubicacion: principal?.ubicacion
        ? {
            id: principal.ubicacion.id,
            tipo: principal.ubicacion.tipo,
            nombre: principal.ubicacion.nombre,
            numero: principal.ubicacion.numero,
          }
        : null,
      edificio: principal?.ubicacion?.edificio
        ? { id: principal.ubicacion.edificio.id, nombre: principal.ubicacion.edificio.nombre }
        : null,
      campus: principal?.ubicacion?.edificio?.campus
        ? {
            id: principal.ubicacion.edificio.campus.id,
            nombre: principal.ubicacion.edificio.campus.nombre,
          }
        : null,
    };
  });

  return { items, total, page: filtros.page, pageSize: filtros.pageSize };
}
