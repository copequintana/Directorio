"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { CampusMap } from "@/components/mapa/campus-map";
import { campusService, edificiosService } from "@/services/catalogos.service";
import type { CampusConMapa } from "@/types/entities";

export default function AdminMapaPage() {
  const [campusLista, setCampusLista] = useState<CampusConMapa[]>([]);
  const [campusId, setCampusId] = useState("");
  const [edificioId, setEdificioId] = useState("");

  const campus = campusLista.find((c) => c.id === campusId) ?? null;

  useEffect(() => {
    campusService.listar().then(async (lista) => {
      const detalles = await Promise.all(lista.map((c) => campusService.obtenerMapa(c.id)));
      setCampusLista(detalles);
      const primero = detalles.find((c) => c.mapaUrl) ?? detalles[0];
      if (primero) setCampusId(primero.id);
    });
  }, []);

  async function onMapClick(x: number, y: number) {
    if (!edificioId) {
      toast.error("Primero elige qué edificio vas a posicionar.");
      return;
    }
    try {
      await edificiosService.posicionar(edificioId, x, y);
      setCampusLista((lista) =>
        lista.map((c) =>
          c.id !== campusId
            ? c
            : {
                ...c,
                edificios: c.edificios.map((e) =>
                  e.id === edificioId ? { ...e, mapaX: x, mapaY: y } : e,
                ),
              },
        ),
      );
      toast.success("Posición guardada.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar la posición.");
    }
  }

  if (campusLista.length === 0) {
    return <p className="text-muted">Cargando…</p>;
  }

  if (!campus?.mapaUrl) {
    return (
      <p className="text-sm text-muted">
        El campus seleccionado no tiene un mapa configurado todavía (campo{" "}
        <code>mapaUrl</code> en <code>/admin/ubicaciones</code>).
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Mapa del campus</h1>
        {campusLista.length > 1 && (
          <Select value={campusId} onChange={(e) => setCampusId(e.target.value)} className="w-56">
            {campusLista.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </Select>
        )}
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">
              1. Elige el edificio que quieres ubicar
            </label>
            <Select value={edificioId} onChange={(e) => setEdificioId(e.target.value)}>
              <option value="">— Selecciona —</option>
              {campus.edificios.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nombre} {e.mapaX !== null ? "✓" : ""}
                </option>
              ))}
            </Select>
          </div>
          <p className="text-sm text-muted">
            2. Haz clic en el mapa donde está ese edificio — se guarda solo. Repite para cada uno.
          </p>
        </CardContent>
      </Card>

      <CampusMap
        mapaUrl={campus.mapaUrl}
        edificios={campus.edificios}
        seleccionadoId={edificioId}
        onMapClick={onMapClick}
      />
    </div>
  );
}
