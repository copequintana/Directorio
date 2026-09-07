"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { extensionesService } from "@/services/extensiones.service";

export function NuevaExtensionForm({ onCreada }: { onCreada: () => void }) {
  const [numero, setNumero] = useState("");
  const [estado, setEstado] = useState("SIN_ASIGNAR");
  const [observaciones, setObservaciones] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    try {
      await extensionesService.crear({ numero, estado, observaciones: observaciones || null });
      toast.success(`Extensión ${numero} creada.`);
      onCreada();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo crear la extensión.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="numero">Número</Label>
            <Input id="numero" required value={numero} onChange={(e) => setNumero(e.target.value)} className="w-32" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="estado">Estado</Label>
            <Select id="estado" value={estado} onChange={(e) => setEstado(e.target.value)} className="w-44">
              <option value="SIN_ASIGNAR">Sin asignar</option>
              <option value="ACTIVA">Activa</option>
              <option value="MANTENIMIENTO">Mantenimiento</option>
              <option value="RESERVADA">Reservada</option>
              <option value="INACTIVA">Inactiva</option>
            </Select>
          </div>
          <div className="flex min-w-48 flex-1 flex-col gap-1.5">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Input id="observaciones" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
          </div>
          <Button type="submit" disabled={enviando}>
            {enviando ? "Creando…" : "Crear"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
