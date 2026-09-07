"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import type { HistorialCambios } from "@/types/entities";

const ACCION_LABEL: Record<string, string> = {
  CREAR: "Creación",
  ACTUALIZAR: "Actualización",
  DESACTIVAR: "Desactivación",
  ASIGNAR: "Asignación",
  DESASIGNAR: "Fin de asignación",
  IMPORTAR: "Importación",
};

export function HistorialPanel({ entidad, entidadId }: { entidad: string; entidadId: string }) {
  const [historial, setHistorial] = useState<HistorialCambios[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<HistorialCambios[]>(`/api/${resourcePath(entidad)}/${entidadId}/historial`)
      .then(setHistorial)
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudo cargar el historial."));
  }, [entidad, entidadId]);

  if (error) return <p className="text-sm text-danger">{error}</p>;
  if (!historial) return <p className="text-sm text-muted">Cargando historial…</p>;
  if (historial.length === 0) return <p className="text-sm text-muted">Sin cambios registrados.</p>;

  return (
    <ul className="flex flex-col divide-y divide-border">
      {historial.map((h) => (
        <li key={h.id} className="flex flex-col gap-0.5 py-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-medium">{ACCION_LABEL[h.accion] ?? h.accion}</span>
            <span className="text-muted">{new Date(h.fecha).toLocaleString("es-MX")}</span>
          </div>
          <span className="text-muted">{h.usuario?.nombre ?? "Sistema (importación)"}</span>
        </li>
      ))}
    </ul>
  );
}

function resourcePath(entidad: string): string {
  const mapa: Record<string, string> = {
    Extension: "extensions",
    Persona: "personas",
    Area: "areas",
    Ubicacion: "ubicaciones",
    Edificio: "edificios",
    Campus: "campus",
  };
  return mapa[entidad] ?? entidad.toLowerCase();
}
