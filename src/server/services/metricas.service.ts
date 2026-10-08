import { prisma } from "@/lib/db/prisma";

/**
 * Registra una llamada a la búsqueda del directorio. Falla en silencio: una
 * métrica nunca debe tumbar la búsqueda real del usuario. `texto` se
 * normaliza (trim + minúsculas) para que el top de búsquedas agrupe bien.
 */
export async function registrarBusqueda(texto: string, resultados: number) {
  try {
    await prisma.busquedaLog.create({
      data: { texto: texto.trim().toLowerCase(), resultados },
    });
  } catch (error) {
    console.error("No se pudo registrar la métrica de búsqueda:", error);
  }
}

function inicioDe(hace: "hoy" | "semana"): Date {
  const ahora = new Date();
  if (hace === "hoy") {
    return new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  }
  const inicio = new Date(ahora);
  inicio.setDate(inicio.getDate() - 7);
  return inicio;
}

export async function obtenerEstadisticasBusqueda() {
  const [hoy, semana, total, topBusquedas] = await Promise.all([
    prisma.busquedaLog.count({ where: { fecha: { gte: inicioDe("hoy") } } }),
    prisma.busquedaLog.count({ where: { fecha: { gte: inicioDe("semana") } } }),
    prisma.busquedaLog.count(),
    prisma.busquedaLog.groupBy({
      by: ["texto"],
      where: { texto: { not: "" } },
      _count: { texto: true },
      orderBy: { _count: { texto: "desc" } },
      take: 10,
    }),
  ]);

  return {
    hoy,
    semana,
    total,
    topBusquedas: topBusquedas.map((b) => ({ texto: b.texto, veces: b._count.texto })),
  };
}
