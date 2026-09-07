"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { extensionesService } from "@/services/extensiones.service";
import { areasService, ubicacionesService } from "@/services/catalogos.service";
import { personasService } from "@/services/personas.service";
import type { Area, Persona, Ubicacion } from "@/types/entities";

export function AsignacionForm({
  extensionId,
  onCreada,
}: {
  extensionId: string;
  onCreada: () => void;
}) {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [personaId, setPersonaId] = useState("");
  const [areaId, setAreaId] = useState("");
  const [ubicacionId, setUbicacionId] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    personasService.listar({ pageSize: 100 }).then((r) => setPersonas(r.items)).catch(() => {});
    areasService.listar().then(setAreas).catch(() => {});
    ubicacionesService.listar().then(setUbicaciones).catch(() => {});
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    try {
      await extensionesService.asignar(extensionId, {
        personaId: personaId || null,
        areaId: areaId || null,
        ubicacionId: ubicacionId || null,
        tipoAsignacion: personaId ? "INDIVIDUAL" : areaId || ubicacionId ? "AREA_SERVICIO" : "SIN_PERSONA",
        esPrincipal: true,
      });
      toast.success("Asignación creada.");
      setPersonaId("");
      setAreaId("");
      setUbicacionId("");
      onCreada();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo crear la asignación.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
      <Select value={personaId} onChange={(e) => setPersonaId(e.target.value)} className="w-56">
        <option value="">Sin persona</option>
        {personas.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nombreCompleto}
          </option>
        ))}
      </Select>
      <Select value={areaId} onChange={(e) => setAreaId(e.target.value)} className="w-48">
        <option value="">Sin área</option>
        {areas.map((a) => (
          <option key={a.id} value={a.id}>
            {a.nombre}
          </option>
        ))}
      </Select>
      <Select value={ubicacionId} onChange={(e) => setUbicacionId(e.target.value)} className="w-48">
        <option value="">Sin ubicación</option>
        {ubicaciones.map((u) => (
          <option key={u.id} value={u.id}>
            {u.nombre ?? u.numero ?? u.tipo}
          </option>
        ))}
      </Select>
      <Button type="submit" size="sm" disabled={enviando}>
        {enviando ? "Asignando…" : "Asignar"}
      </Button>
    </form>
  );
}
