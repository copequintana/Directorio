"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CampusMap } from "@/components/mapa/campus-map";
import { campusService } from "@/services/catalogos.service";
import { buscarDirectorio } from "@/services/directorio.service";
import { compararUbicaciones, TIPO_UBICACION_LABEL } from "@/lib/format";
import type { CampusConMapa, Edificio, SearchResultItem } from "@/types/entities";

function formatUbicacionResultado(u: SearchResultItem["ubicacion"]): string {
  if (!u) return "—";
  const tipoLabel = TIPO_UBICACION_LABEL[u.tipo] ?? u.tipo;
  const detalle = u.nombre ?? u.numero;
  return detalle ? `${tipoLabel} ${detalle}` : tipoLabel;
}

export default function MapaPage() {
  const [campus, setCampus] = useState<CampusConMapa | null>(null);
  const [edificioActivo, setEdificioActivo] = useState<Edificio | null>(null);
  const [resultados, setResultados] = useState<SearchResultItem[] | null>(null);
  const [cargandoResultados, setCargandoResultados] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resultadosRef = useRef<HTMLDivElement>(null);

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
    // El mapa es alto; sin esto no es obvio que algo pasó al tocar un pin.
    setTimeout(() => resultadosRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 50);
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
        <Card ref={resultadosRef}>
          <CardContent className="flex flex-col gap-2">
            <h2 className="font-semibold">{edificioActivo.nombre}</h2>
            {cargandoResultados && <p className="text-sm text-muted">Cargando…</p>}
            {resultados && resultados.length === 0 && (
              <p className="text-sm text-muted">No hay extensiones registradas en este edificio todavía.</p>
            )}
            {resultados && resultados.length > 0 && (
              <table className="w-full text-sm">
                <thead className="border-b border-border text-left text-xs text-muted">
                  <tr>
                    <th className="py-1.5 pr-2 font-medium">Persona / Área</th>
                    <th className="py-1.5 pr-2 font-medium">Ubicación</th>
                    <th className="py-1.5 text-right font-medium">Extensión</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[...resultados]
                    .sort(
                      (a, b) =>
                        compararUbicaciones(a.ubicacion, b.ubicacion) ||
                        a.numero.localeCompare(b.numero, "es", { numeric: true }),
                    )
                    .map((r) => (
                      <tr key={r.extensionId}>
                        <td className="py-1.5 pr-2">
                          {r.personas.map((p) => p.nombreCompleto).join(", ") || r.area?.nombre || "Sin asignar"}
                        </td>
                        <td className="py-1.5 pr-2 text-muted">{formatUbicacionResultado(r.ubicacion)}</td>
                        <td className="py-1.5 text-right font-semibold text-primary">{r.numero}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
