"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { solicitudesService } from "@/services/solicitudes.service";

export function ReportarErrorForm({ extensionId }: { extensionId: string }) {
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    try {
      await solicitudesService.reportar(extensionId, {
        nombreSolicitante: nombre,
        correoSolicitante: correo || undefined,
        mensaje,
      });
      setEnviado(true);
      setNombre("");
      setCorreo("");
      setMensaje("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo enviar el reporte.");
    } finally {
      setEnviando(false);
    }
  }

  if (!abierto) {
    return (
      <Button variant="outline" size="sm" className="self-start" onClick={() => setAbierto(true)}>
        <Flag className="h-4 w-4" />
        ¿Ves un dato incorrecto? Repórtalo
      </Button>
    );
  }

  if (enviado) {
    return (
      <Card>
        <CardContent>
          <p className="text-sm text-success">
            Gracias, tu reporte fue enviado. El administrador lo revisará.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <p className="text-sm font-medium">Reportar un dato incorrecto</p>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nombre-reporte">Tu nombre</Label>
            <Input id="nombre-reporte" required value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="correo-reporte">Tu correo (opcional, por si el admin necesita contactarte)</Label>
            <Input
              id="correo-reporte"
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="mensaje-reporte">¿Qué está mal?</Label>
            <Textarea
              id="mensaje-reporte"
              required
              minLength={5}
              placeholder="Ej. Esta extensión ya no es de esta persona, ahora es de..."
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={enviando}>
              {enviando ? "Enviando…" : "Enviar reporte"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setAbierto(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
