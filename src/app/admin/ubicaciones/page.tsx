"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { campusService, edificiosService, ubicacionesService } from "@/services/catalogos.service";
import type { Campus, Edificio, Ubicacion } from "@/types/entities";

const TIPOS = ["OFICINA", "CUBICULO", "AULA", "VENTANILLA", "LABORATORIO", "SITE", "AREA", "OTRO"];

export default function AdminUbicacionesPage() {
  const [campus, setCampus] = useState<Campus[]>([]);
  const [edificios, setEdificios] = useState<Edificio[]>([]);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);

  const [nuevoCampus, setNuevoCampus] = useState({ nombre: "", clave: "" });
  const [mapaUrls, setMapaUrls] = useState<Record<string, string>>({});
  const [nuevoEdificio, setNuevoEdificio] = useState({ nombre: "", campusId: "" });
  const [nuevaUbicacion, setNuevaUbicacion] = useState({ nombre: "", tipo: "OFICINA", edificioId: "" });
  const [filtroUbicacion, setFiltroUbicacion] = useState("");
  const [edificioEdit, setEdificioEdit] = useState<Record<string, string>>({});

  async function cargarTodo() {
    const [c, e, u] = await Promise.all([
      campusService.listar(),
      edificiosService.listar(),
      ubicacionesService.listar(),
    ]);
    setCampus(c);
    setEdificios(e);
    setUbicaciones(u);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarTodo().catch((err) => toast.error(err instanceof Error ? err.message : "Error al cargar."));
  }, []);

  async function crearCampus(e: React.FormEvent) {
    e.preventDefault();
    try {
      await campusService.crear(nuevoCampus);
      toast.success("Campus creado.");
      setNuevoCampus({ nombre: "", clave: "" });
      cargarTodo();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo crear el campus.");
    }
  }

  async function crearEdificio(e: React.FormEvent) {
    e.preventDefault();
    try {
      await edificiosService.crear(nuevoEdificio);
      toast.success("Edificio creado.");
      setNuevoEdificio({ nombre: "", campusId: "" });
      cargarTodo();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo crear el edificio.");
    }
  }

  async function crearUbicacion(e: React.FormEvent) {
    e.preventDefault();
    try {
      await ubicacionesService.crear({
        ...nuevaUbicacion,
        edificioId: nuevaUbicacion.edificioId || null,
      });
      toast.success("Ubicación creada.");
      setNuevaUbicacion({ nombre: "", tipo: "OFICINA", edificioId: "" });
      cargarTodo();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo crear la ubicación.");
    }
  }

  async function guardarMapaUrl(id: string) {
    try {
      await campusService.actualizar(id, { mapaUrl: mapaUrls[id] || null });
      toast.success("Mapa actualizado.");
      cargarTodo();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar el mapa.");
    }
  }

  async function guardarEdificioUbicacion(ubicacionId: string) {
    const edificioId = edificioEdit[ubicacionId] ?? "";
    try {
      await ubicacionesService.actualizar(ubicacionId, { edificioId: edificioId || null });
      toast.success("Edificio asignado.");
      cargarTodo();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo asignar el edificio.");
    }
  }

  async function desactivar(tipo: "campus" | "edificio" | "ubicacion", id: string) {
    if (!confirm("¿Desactivar este registro?")) return;
    const servicio = { campus: campusService, edificio: edificiosService, ubicacion: ubicacionesService }[tipo];
    try {
      await servicio.desactivar(id);
      toast.success("Desactivado.");
      cargarTodo();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo desactivar.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Ubicaciones</h1>

      <Card>
        <CardHeader>
          <CardTitle>Campus</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form onSubmit={crearCampus} className="flex flex-wrap items-end gap-2">
            <Input
              placeholder="Nombre"
              required
              value={nuevoCampus.nombre}
              onChange={(e) => setNuevoCampus((f) => ({ ...f, nombre: e.target.value }))}
              className="w-48"
            />
            <Input
              placeholder="Clave"
              required
              value={nuevoCampus.clave}
              onChange={(e) => setNuevoCampus((f) => ({ ...f, clave: e.target.value }))}
              className="w-32"
            />
            <Button type="submit" size="sm">
              Agregar campus
            </Button>
          </form>
          <ul className="flex flex-col divide-y divide-border text-sm">
            {campus.map((c) => (
              <li key={c.id} className="flex flex-col gap-2 py-2">
                <div className="flex items-center justify-between">
                  <span>
                    {c.nombre} <span className="text-muted">({c.clave})</span>
                  </span>
                  <button onClick={() => desactivar("campus", c.id)} className="text-danger hover:underline">
                    Desactivar
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="/campus-maps/archivo.jpg"
                    value={mapaUrls[c.id] ?? c.mapaUrl ?? ""}
                    onChange={(e) => setMapaUrls((m) => ({ ...m, [c.id]: e.target.value }))}
                    className="h-8 flex-1 text-xs"
                  />
                  <Button size="sm" variant="outline" onClick={() => guardarMapaUrl(c.id)}>
                    Guardar mapa
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Edificios</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form onSubmit={crearEdificio} className="flex flex-wrap items-end gap-2">
            <Select
              required
              value={nuevoEdificio.campusId}
              onChange={(e) => setNuevoEdificio((f) => ({ ...f, campusId: e.target.value }))}
              className="w-48"
            >
              <option value="">Campus…</option>
              {campus.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </Select>
            <Input
              placeholder="Nombre del edificio"
              required
              value={nuevoEdificio.nombre}
              onChange={(e) => setNuevoEdificio((f) => ({ ...f, nombre: e.target.value }))}
              className="w-56"
            />
            <Button type="submit" size="sm">
              Agregar edificio
            </Button>
          </form>
          <ul className="flex flex-col divide-y divide-border text-sm">
            {edificios.map((e) => (
              <li key={e.id} className="flex items-center justify-between py-1.5">
                <span>
                  {e.nombre} <span className="text-muted">({e.campus?.nombre})</span>
                </span>
                <button onClick={() => desactivar("edificio", e.id)} className="text-danger hover:underline">
                  Desactivar
                </button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ubicaciones</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form onSubmit={crearUbicacion} className="flex flex-wrap items-end gap-2">
            <Select
              value={nuevaUbicacion.tipo}
              onChange={(e) => setNuevaUbicacion((f) => ({ ...f, tipo: e.target.value }))}
              className="w-40"
            >
              {TIPOS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
            <Input
              placeholder="Nombre / número"
              value={nuevaUbicacion.nombre}
              onChange={(e) => setNuevaUbicacion((f) => ({ ...f, nombre: e.target.value }))}
              className="w-48"
            />
            <Select
              value={nuevaUbicacion.edificioId}
              onChange={(e) => setNuevaUbicacion((f) => ({ ...f, edificioId: e.target.value }))}
              className="w-56"
            >
              <option value="">Sin edificio identificado</option>
              {edificios.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nombre} ({e.campus?.nombre})
                </option>
              ))}
            </Select>
            <Button type="submit" size="sm">
              Agregar ubicación
            </Button>
          </form>

          <Input
            placeholder="Buscar por nombre o tipo…"
            value={filtroUbicacion}
            onChange={(e) => setFiltroUbicacion(e.target.value)}
            className="max-w-xs"
          />

          <ul className="flex flex-col divide-y divide-border text-sm">
            {ubicaciones
              .filter((u) => {
                const texto = `${u.tipo} ${u.nombre ?? ""} ${u.numero ?? ""}`.toLowerCase();
                return texto.includes(filtroUbicacion.toLowerCase());
              })
              .map((u) => (
                <li key={u.id} className="flex flex-wrap items-center justify-between gap-2 py-1.5">
                  <span>
                    {u.tipo} {u.nombre ?? u.numero ?? ""}
                  </span>
                  <div className="flex items-center gap-2">
                    <Select
                      value={edificioEdit[u.id] ?? u.edificioId ?? ""}
                      onChange={(e) => setEdificioEdit((m) => ({ ...m, [u.id]: e.target.value }))}
                      className="h-8 w-56 text-xs"
                    >
                      <option value="">Sin edificio identificado</option>
                      {edificios.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.nombre} ({e.campus?.nombre})
                        </option>
                      ))}
                    </Select>
                    <Button size="sm" variant="outline" onClick={() => guardarEdificioUbicacion(u.id)}>
                      Guardar
                    </Button>
                    <button onClick={() => desactivar("ubicacion", u.id)} className="text-danger hover:underline">
                      Desactivar
                    </button>
                  </div>
                </li>
              ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
