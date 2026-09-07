import { prisma } from "@/lib/db/prisma";

/** Indicadores del panel /admin (spec sección 10). Se consulta directamente
 * desde el Server Component de la página: no hay un consumidor externo de
 * la API para estos datos, así que no se justifica exponer un endpoint REST
 * aparte. */
export async function obtenerIndicadoresDashboard() {
  const [totalExtensiones, extensionesActivas, extensionesSinAsignar, extensionesInactivas, totalPersonas, totalAreas] =
    await Promise.all([
      prisma.extension.count({ where: { activo: true } }),
      prisma.extension.count({ where: { activo: true, estado: "ACTIVA" } }),
      prisma.extension.count({ where: { activo: true, estado: "SIN_ASIGNAR" } }),
      prisma.extension.count({ where: { activo: false } }),
      prisma.persona.count({ where: { activo: true } }),
      prisma.area.count({ where: { activo: true } }),
    ]);

  return {
    totalExtensiones,
    extensionesActivas,
    extensionesSinAsignar,
    extensionesInactivas,
    totalPersonas,
    totalAreas,
  };
}
