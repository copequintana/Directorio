"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CampusMap } from "@/components/mapa/campus-map";
import { campusService } from "@/services/catalogos.service";
import { buscarDirectorio } from "@/services/directorio.service";
import type { CampusConMapa, Edificio, SearchResultItem } from "@/types/entities";

export default function MapaPage() {
  const [campus, setCampus] = useState<CampusConMapa | null>(null);
  const [edificioActivo, setEdificioActivo] = useState<Edificio | null>(null);
  const [resultados, setResultados] = useState<SearchResultItem[] | null>(null);
  const [cargandoResultados, setCargandoResultados] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    campusService
      .listar()
      .then(async (lista) => {
        const conMapa = lista.find((c) => c.mapaUrl);
        if (!conMapa) {
          setError("Todavía no hay un mapa de campus configurado.");
          return;
        }
        const detalle = await campusService.obtenerMapa(conMapa.id);
        setCampus(detalle);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudo cargar el mapa."));
  }, []);

  async function onPinClick(edificio: Edificio) {
    setEdificioActivo(edificio);
    setResultados(null);
    setCargandoResultados(true);
    try {
      const res = await buscarDirectorio({ edificioId: edificio.id, pageSize: 50 });
      setResultados(res.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar la información del edificio.");
    } finally {
      setCargandoResultados(false);
    }
  }

  if (error) return <p className="mx-auto max-w-3xl px-4 py-8 text-sm text-danger">{error}</p>;
  if (!campus) return <p className="mx-auto max-w-3xl px-4 py-8 text-muted">Cargando mapa…</p>;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-8">
      <div>
        <h1 className="text-xl font-semibold">Mapa del campus — {campus.nombre}</h1>
        <p className="text-sm text-muted">Toca un edificio para ver quién está ahí.</p>
      </div>

      <CampusMap
        mapaUrl={campus.mapaUrl!}
        edificios={campus.edificios}
        seleccionadoId={edificioActivo?.id}
        onPinClick={onPinClick}
      />

      {edificioActivo && (
        <Card>
          <CardContent className="flex flex-col gap-2">
            <h2 className="font-semibold">{edificioActivo.nombre}</h2>
            {cargandoResultados && <p className="text-sm text-muted">Cargando…</p>}
            {resultados && resultados.length === 0 && (
              <p className="text-sm text-muted">No hay extensiones registradas en este edificio todavía.</p>
            )}
            {resultados && resultados.length > 0 && (
              <ul className="flex flex-col divide-y divide-border text-sm">
                {resultados.map((r) => (
                  <li key={r.extensionId} className="flex items-center justify-between py-1.5">
                    <span>
                      {r.personas.map((p) => p.nombreCompleto).join(", ") || r.area?.nombre || "Sin asignar"}
                    </span>
                    <span className="font-semibold text-primary">{r.numero}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
