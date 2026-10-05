"use client";

import { useEffect, useState } from "react";
import { Select } from "@/components/ui/input";
import { areasService, campusService, edificiosService, ubicacionesService } from "@/services/catalogos.service";
import { compararUbicaciones, formatUbicacion } from "@/lib/format";
import type { Area, Campus, Edificio, Ubicacion } from "@/types/entities";

export interface FiltrosValor {
  campusId: string;
  areaId: string;
  edificioId: string;
  ubicacionId: string;
  estado: string;
}

const ESTADOS = [
  { value: "", label: "Todos los estados" },
  { value: "ACTIVA", label: "Activa" },
  { value: "SIN_ASIGNAR", label: "Sin asignar" },
  { value: "MANTENIMIENTO", label: "Mantenimiento" },
  { value: "RESERVADA", label: "Reservada" },
  { value: "INACTIVA", label: "Inactiva" },
];

export function FiltrosBusqueda({
  valor,
  onChange,
}: {
  valor: FiltrosValor;
  onChange: (valor: FiltrosValor) => void;
}) {
  const [campus, setCampus] = useState<Campus[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [edificios, setEdificios] = useState<Edificio[]>([]);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);

  useEffect(() => {
    campusService.listar().then(setCampus).catch(() => setCampus([]));
    areasService.listar().then(setAreas).catch(() => setAreas([]));
  }, []);

  useEffect(() => {
    edificiosService
      .listar({ campusId: valor.campusId || undefined })
      .then(setEdificios)
      .catch(() => setEdificios([]));
  }, [valor.campusId]);

  useEffect(() => {
    ubicacionesService
      .listar({ edificioId: valor.edificioId || undefined })
      .then(setUbicaciones)
      .catch(() => setUbicaciones([]));
  }, [valor.edificioId]);

  function set<K extends keyof FiltrosValor>(key: K, value: string) {
    onChange({ ...valor, [key]: value });
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      <Select value={valor.campusId} onChange={(e) => set("campusId", e.target.value)}>
        <option value="">Todos los campus</option>
        {campus.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nombre}
          </option>
        ))}
      </Select>

      <Select value={valor.areaId} onChange={(e) => set("areaId", e.target.value)}>
        <option value="">Todas las áreas</option>
        {areas.map((a) => (
          <option key={a.id} value={a.id}>
            {a.nombre}
          </option>
        ))}
      </Select>

      <Select value={valor.edificioId} onChange={(e) => set("edificioId", e.target.value)}>
        <option value="">Todos los edificios</option>
        {edificios.map((e) => (
          <option key={e.id} value={e.id}>
            {e.nombre}
          </option>
        ))}
      </Select>

      <Select value={valor.ubicacionId} onChange={(e) => set("ubicacionId", e.target.value)}>
        <option value="">Todas las ubicaciones</option>
        {[...ubicaciones].sort(compararUbicaciones).map((u) => (
          <option key={u.id} value={u.id}>
            {formatUbicacion(u)}
          </option>
        ))}
      </Select>

      <Select value={valor.estado} onChange={(e) => set("estado", e.target.value)}>
        {ESTADOS.map((e) => (
          <option key={e.value} value={e.value}>
            {e.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
