"use client";

import { use, useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { HistorialPanel } from "@/components/admin/historial-panel";
import { AsignacionForm } from "@/components/admin/asignacion-form";
import { extensionesService } from "@/services/extensiones.service";
import type { Extension } from "@/types/entities";

export default function EditarExtensionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [extension, setExtension] = useState<Extension | null>(null);
  const [form, setForm] = useState({ numero: "", estado: "SIN_ASIGNAR", observaciones: "" });
  const [guardando, setGuardando] = useState(false);
  const [editandoAsignacionId, setEditandoAsignacionId] = useState<string | null>(null);

  async function cargar() {
    const ext = await extensionesService.obtener(id);
    setExtension(ext);
    setForm({ numero: ext.numero, estado: ext.estado, observaciones: ext.observaciones ?? "" });
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar().catch((err) => toast.error(err instanceof Error ? err.message : "No se pudo cargar."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    try {
      await extensionesService.actualizar(id, form);
      toast.success("Extensión actualizada.");
      cargar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar.");
    } finally {
      setGuardando(false);
    }
  }

  async function quitarAsignacion(asignacionId: string) {
    if (!confirm("¿Finalizar esta asignación?")) return;
    try {
      await extensionesService.desasignar(id, asignacionId);
      toast.success("Asignación finalizada.");
      cargar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo finalizar la asignación.");
    }
  }

  if (!extension) return <p className="text-muted">Cargando…</p>;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Extensión {extension.numero}</h1>

      <Card>
        <CardHeader>
          <CardTitle>Datos generales</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={guardar} className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="numero">Número</Label>
              <Input
                id="numero"
                value={form.numero}
                onChange={(e) => setForm((f) => ({ ...f, numero: e.target.value }))}
                className="w-32"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="estado">Estado</Label>
              <Select
                id="estado"
                value={form.estado}
                onChange={(e) => setForm((f) => ({ ...f, estado: e.target.value }))}
                className="w-44"
              >
                <option value="SIN_ASIGNAR">Sin asignar</option>
                <option value="ACTIVA">Activa</option>
                <option value="MANTENIMIENTO">Mantenimiento</option>
                <option value="RESERVADA">Reservada</option>
                <option value="INACTIVA">Inactiva</option>
              </Select>
            </div>
            <div className="flex min-w-64 flex-1 flex-col gap-1.5">
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea
                id="observaciones"
                value={form.observaciones}
                onChange={(e) => setForm((f) => ({ ...f, observaciones: e.target.value }))}
              />
            </div>
            <Button type="submit" disabled={guardando}>
              {guardando ? "Guardando…" : "Guardar"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Asignaciones activas</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {extension.asignaciones.length === 0 ? (
            <p className="text-sm text-muted">Sin asignaciones activas.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {extension.asignaciones.map((a) =>
                editandoAsignacionId === a.id ? (
                  <li key={a.id} className="py-2">
                    <AsignacionForm
                      extensionId={id}
                      asignacion={a}
                      onGuardada={() => {
                        setEditandoAsignacionId(null);
                        cargar();
                      }}
                      onCancelar={() => setEditandoAsignacionId(null)}
                    />
                  </li>
                ) : (
                  <li key={a.id} className="flex items-center justify-between py-2 text-sm">
                    <span>
                      {a.persona?.nombreCompleto ?? "(sin persona)"}
                      {a.area ? ` · ${a.area.nombre}` : ""}
                      {a.ubicacion ? ` · ${a.ubicacion.nombre ?? a.ubicacion.numero ?? a.ubicacion.tipo}` : ""}
                      {a.tipoAsignacion === "COMPARTIDA" && " · Compartida"}
                    </span>
                    <span className="flex gap-3">
                      <button
                        onClick={() => setEditandoAsignacionId(a.id)}
                        className="text-accent hover:underline"
                      >
                        Editar
                      </button>
                      <button onClick={() => quitarAsignacion(a.id)} className="text-danger hover:underline">
                        Quitar
                      </button>
                    </span>
                  </li>
                ),
              )}
            </ul>
          )}

          <div className="border-t border-border pt-3">
            <p className="mb-2 text-sm font-medium">Agregar asignación</p>
            <AsignacionForm extensionId={id} onGuardada={cargar} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial</CardTitle>
        </CardHeader>
        <CardContent>
          <HistorialPanel entidad="Extension" entidadId={id} />
        </CardContent>
      </Card>
    </div>
  );
}
