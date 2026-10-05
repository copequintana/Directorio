"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { extensionesService } from "@/services/extensiones.service";
import { areasService, ubicacionesService } from "@/services/catalogos.service";
import { personasService } from "@/services/personas.service";
import { compararUbicaciones, formatUbicacion } from "@/lib/format";
import type { Area, AsignacionExtension, Persona, Ubicacion } from "@/types/entities";

export function AsignacionForm({
  extensionId,
  asignacion,
  onGuardada,
  onCancelar,
}: {
  extensionId: string;
  /** Si se pasa, el formulario edita esta asignación en vez de crear una nueva. */
  asignacion?: AsignacionExtension;
  onGuardada: () => void;
  onCancelar?: () => void;
}) {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [personaId, setPersonaId] = useState(asignacion?.personaId ?? "");
  const [areaId, setAreaId] = useState(asignacion?.areaId ?? "");
  const [ubicacionId, setUbicacionId] = useState(asignacion?.ubicacionId ?? "");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    personasService.listar({ pageSize: 100 }).then((r) => setPersonas(r.items)).catch(() => {});
    areasService.listar().then(setAreas).catch(() => {});
    ubicacionesService.listar().then(setUbicaciones).catch(() => {});
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    const datos = {
      personaId: personaId || null,
      areaId: areaId || null,
      ubicacionId: ubicacionId || null,
      tipoAsignacion: personaId ? "INDIVIDUAL" : areaId || ubicacionId ? "AREA_SERVICIO" : "SIN_PERSONA",
    } as const;
    try {
      if (asignacion) {
        await extensionesService.editarAsignacion(extensionId, asignacion.id, datos);
        toast.success("Asignación actualizada.");
      } else {
        await extensionesService.asignar(extensionId, { ...datos, esPrincipal: true });
        toast.success("Asignación creada.");
        setPersonaId("");
        setAreaId("");
        setUbicacionId("");
      }
      onGuardada();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar la asignación.");
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
        {[...ubicaciones].sort(compararUbicaciones).map((u) => (
          <option key={u.id} value={u.id}>
            {formatUbicacion(u)}
          </option>
        ))}
      </Select>
      <Button type="submit" size="sm" disabled={enviando}>
        {enviando ? "Guardando…" : asignacion ? "Guardar cambios" : "Asignar"}
      </Button>
      {onCancelar && (
        <Button type="button" size="sm" variant="ghost" onClick={onCancelar}>
          Cancelar
        </Button>
      )}
    </form>
  );
}
