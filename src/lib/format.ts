import type { Ubicacion } from "@/types/entities";

export const TIPO_UBICACION_LABEL: Record<string, string> = {
  OFICINA: "Oficina",
  CUBICULO: "Cubículo",
  AULA: "Aula",
  VENTANILLA: "Ventanilla",
  LABORATORIO: "Laboratorio",
  SITE: "SITE",
  AREA: "Área",
  OTRO: "Otro",
};

/**
 * "Cubículo 1" no es único globalmente (docs/DATABASE.md) — mostrar solo
 * `nombre` en un <select> hace indistinguibles varias ubicaciones distintas
 * con el mismo texto. Siempre se antepone el tipo y, si ya se sabe, el
 * edificio, para que cada opción sea identificable.
 */
const COLLATOR = new Intl.Collator("es", { numeric: true, sensitivity: "base" });

/** Orden natural (Cubículo 1, 2, 3…10, 11) en vez del alfabético por
 * defecto ("1, 10, 11, 12…2, 3"), agrupado por tipo primero. */
export function compararUbicaciones(a: Ubicacion, b: Ubicacion): number {
  return (
    COLLATOR.compare(a.tipo, b.tipo) ||
    COLLATOR.compare(a.nombre ?? a.numero ?? "", b.nombre ?? b.numero ?? "")
  );
}

export function formatUbicacion(
  u: Pick<Ubicacion, "tipo" | "nombre" | "numero" | "edificio">,
): string {
  const tipoLabel = TIPO_UBICACION_LABEL[u.tipo] ?? u.tipo;
  const detalle = u.nombre ?? u.numero;
  const base = detalle ? `${tipoLabel} ${detalle}` : tipoLabel;
  return u.edificio ? `${base} · ${u.edificio.nombre}` : `${base} (sin edificio)`;
}
