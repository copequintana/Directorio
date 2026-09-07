"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { areasService } from "@/services/catalogos.service";
import type { Area } from "@/types/entities";

const VACIO = { id: "", nombre: "", descripcion: "", areaPadreId: "" };

export default function AdminAreasPage() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [form, setForm] = useState(VACIO);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function cargar() {
    const res = await areasService.listar();
    setAreas(res);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar().catch((err) => toast.error(err instanceof Error ? err.message : "Error al cargar."));
  }, []);

  const raiz = areas.filter((a) => !a.areaPadreId);
  const hijasPorPadre = new Map<string, Area[]>();
  areas.forEach((a) => {
    if (a.areaPadreId) {
      hijasPorPadre.set(a.areaPadreId, [...(hijasPorPadre.get(a.areaPadreId) ?? []), a]);
    }
  });

  function editar(area: Area) {
    setForm({
      id: area.id,
      nombre: area.nombre,
      descripcion: area.descripcion ?? "",
      areaPadreId: area.areaPadreId ?? "",
    });
    setMostrarForm(true);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    const payload = {
      nombre: form.nombre,
      descripcion: form.descripcion || null,
      areaPadreId: form.areaPadreId || null,
    };
    try {
      if (form.id) {
        await areasService.actualizar(form.id, payload);
        toast.success("Área actualizada.");
      } else {
        await areasService.crear(payload);
        toast.success("Área creada.");
      }
      setForm(VACIO);
      setMostrarForm(false);
      cargar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setEnviando(false);
    }
  }

  async function desactivar(id: string, nombre: string) {
    if (!confirm(`¿Desactivar "${nombre}"?`)) return;
    try {
      await areasService.desactivar(id);
      toast.success("Área desactivada.");
      cargar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo desactivar.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Áreas</h1>
        <Button
          size="sm"
          onClick={() => {
            setForm(VACIO);
            setMostrarForm((v) => !v);
          }}
        >
          {mostrarForm ? "Cancelar" : "+ Nueva área"}
        </Button>
      </div>

      {mostrarForm && (
        <Card>
          <CardContent>
            <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Nombre</Label>
                <Input required value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Área padre (opcional)</Label>
                <Select
                  value={form.areaPadreId}
                  onChange={(e) => setForm((f) => ({ ...f, areaPadreId: e.target.value }))}
                  className="w-56"
                >
                  <option value="">— Área principal —</option>
                  {raiz
                    .filter((a) => a.id !== form.id)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nombre}
                      </option>
                    ))}
                </Select>
              </div>
              <div className="flex min-w-48 flex-1 flex-col gap-1.5">
                <Label>Descripción</Label>
                <Input value={form.descripcion} onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))} />
              </div>
              <Button type="submit" disabled={enviando}>
                {enviando ? "Guardando…" : form.id ? "Guardar" : "Crear"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {raiz.map((area) => (
          <Card key={area.id}>
            <CardContent className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{area.nombre}</span>
                <div className="flex gap-2 text-sm">
                  <button onClick={() => editar(area)} className="text-accent hover:underline">
                    Editar
                  </button>
                  <button onClick={() => desactivar(area.id, area.nombre)} className="text-danger hover:underline">
                    Desactivar
                  </button>
                </div>
              </div>
              {(hijasPorPadre.get(area.id) ?? []).length > 0 && (
                <ul className="ml-4 flex flex-col gap-1 border-l border-border pl-3 text-sm">
                  {(hijasPorPadre.get(area.id) ?? []).map((sub) => (
                    <li key={sub.id} className="flex items-center justify-between">
                      <span>{sub.nombre}</span>
                      <div className="flex gap-2">
                        <button onClick={() => editar(sub)} className="text-accent hover:underline">
                          Editar
                        </button>
                        <button onClick={() => desactivar(sub.id, sub.nombre)} className="text-danger hover:underline">
                          Desactivar
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
