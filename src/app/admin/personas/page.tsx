"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { personasService } from "@/services/personas.service";
import { areasService, puestosService } from "@/services/catalogos.service";
import type { Area, Persona, Puesto } from "@/types/entities";

const VACIO = {
  id: "",
  nombre: "",
  apellidoPaterno: "",
  apellidoMaterno: "",
  correo: "",
  puestoId: "",
  areaId: "",
};

export default function AdminPersonasPage() {
  const [items, setItems] = useState<Persona[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [areas, setAreas] = useState<Area[]>([]);
  const [puestos, setPuestos] = useState<Puesto[]>([]);
  const [form, setForm] = useState(VACIO);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function cargar() {
    const res = await personasService.listar({ q: q || undefined, pageSize: 50 });
    setItems(res.items);
    setTotal(res.total);
  }

  useEffect(() => {
    areasService.listar().then(setAreas).catch(() => {});
    puestosService.listar().then(setPuestos).catch(() => {});
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar().catch((err) => toast.error(err instanceof Error ? err.message : "Error al cargar."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function editar(persona: Persona) {
    setForm({
      id: persona.id,
      nombre: persona.nombre,
      apellidoPaterno: persona.apellidoPaterno ?? "",
      apellidoMaterno: persona.apellidoMaterno ?? "",
      correo: persona.correo ?? "",
      puestoId: persona.puestoId ?? "",
      areaId: persona.areaId ?? "",
    });
    setMostrarForm(true);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    const payload = {
      nombre: form.nombre,
      apellidoPaterno: form.apellidoPaterno || null,
      apellidoMaterno: form.apellidoMaterno || null,
      correo: form.correo || null,
      puestoId: form.puestoId || null,
      areaId: form.areaId || null,
    };
    try {
      if (form.id) {
        await personasService.actualizar(form.id, payload);
        toast.success("Persona actualizada.");
      } else {
        await personasService.crear(payload);
        toast.success("Persona creada.");
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
    if (!confirm(`¿Desactivar a ${nombre}?`)) return;
    try {
      await personasService.desactivar(id);
      toast.success("Persona desactivada.");
      cargar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo desactivar.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Personas</h1>
        <Button
          size="sm"
          onClick={() => {
            setForm(VACIO);
            setMostrarForm((v) => !v);
          }}
        >
          {mostrarForm ? "Cancelar" : "+ Nueva persona"}
        </Button>
      </div>

      {mostrarForm && (
        <Card>
          <CardContent>
            <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Nombre">
                <Input required value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} />
              </Field>
              <Field label="Apellido paterno">
                <Input value={form.apellidoPaterno} onChange={(e) => setForm((f) => ({ ...f, apellidoPaterno: e.target.value }))} />
              </Field>
              <Field label="Apellido materno">
                <Input value={form.apellidoMaterno} onChange={(e) => setForm((f) => ({ ...f, apellidoMaterno: e.target.value }))} />
              </Field>
              <Field label="Correo">
                <Input type="email" value={form.correo} onChange={(e) => setForm((f) => ({ ...f, correo: e.target.value }))} />
              </Field>
              <Field label="Puesto">
                <Select value={form.puestoId} onChange={(e) => setForm((f) => ({ ...f, puestoId: e.target.value }))}>
                  <option value="">—</option>
                  {puestos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Área">
                <Select value={form.areaId} onChange={(e) => setForm((f) => ({ ...f, areaId: e.target.value }))}>
                  <option value="">—</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nombre}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="sm:col-span-2 lg:col-span-3">
                <Button type="submit" disabled={enviando}>
                  {enviando ? "Guardando…" : form.id ? "Guardar cambios" : "Crear persona"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Input placeholder="Buscar por nombre o correo…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted-bg text-left">
              <tr>
                <th className="px-3 py-2">Nombre</th>
                <th className="px-3 py-2">Puesto</th>
                <th className="px-3 py-2">Área</th>
                <th className="px-3 py-2">Correo</th>
                <th className="px-3 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 font-medium">{p.nombreCompleto}</td>
                  <td className="px-3 py-2">{p.puesto?.nombre ?? "—"}</td>
                  <td className="px-3 py-2">{p.area?.nombre ?? "—"}</td>
                  <td className="px-3 py-2">{p.correo ?? "—"}</td>
                  <td className="flex gap-2 px-3 py-2">
                    <button onClick={() => editar(p)} className="text-accent hover:underline">
                      Editar
                    </button>
                    <button onClick={() => desactivar(p.id, p.nombreCompleto)} className="text-danger hover:underline">
                      Desactivar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
      <p className="text-sm text-muted">{total} persona(s)</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
