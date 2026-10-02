"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { solicitudesService } from "@/services/solicitudes.service";
import type { SolicitudCambio } from "@/types/entities";

const ESTADO_VARIANT: Record<string, "neutral" | "success" | "danger" | "warning"> = {
  PENDIENTE: "warning",
  APLICADA: "success",
  RECHAZADA: "danger",
};

export default function AdminSolicitudesPage() {
  const [items, setItems] = useState<SolicitudCambio[]>([]);
  const [filtro, setFiltro] = useState("PENDIENTE");
  const [notas, setNotas] = useState<Record<string, string>>({});

  async function cargar() {
    try {
      const res = await solicitudesService.listar(filtro || undefined);
      setItems(res);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudieron cargar las solicitudes.");
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtro]);

  async function resolver(id: string, estado: "APLICADA" | "RECHAZADA") {
    try {
      await solicitudesService.resolver(id, { estado, notaAdmin: notas[id] });
      toast.success(estado === "APLICADA" ? "Marcada como aplicada." : "Solicitud rechazada.");
      cargar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar la solicitud.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Solicitudes de corrección</h1>
        <Select value={filtro} onChange={(e) => setFiltro(e.target.value)} className="w-48">
          <option value="PENDIENTE">Pendientes</option>
          <option value="APLICADA">Aplicadas</option>
          <option value="RECHAZADA">Rechazadas</option>
          <option value="">Todas</option>
        </Select>
      </div>

      {items.length === 0 && (
        <p className="text-sm text-muted">No hay solicitudes con este filtro.</p>
      )}

      <div className="flex flex-col gap-3">
        {items.map((s) => (
          <Card key={s.id}>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link href={`/extensions/${s.extensionId}`} className="font-semibold text-accent hover:underline">
                    Extensión {s.extension?.numero}
                  </Link>
                  <p className="text-sm text-muted">
                    {s.nombreSolicitante}
                    {s.correoSolicitante ? ` · ${s.correoSolicitante}` : ""} ·{" "}
                    {new Date(s.createdAt).toLocaleString("es-MX")}
                  </p>
                </div>
                <Badge variant={ESTADO_VARIANT[s.estado]}>{s.estado}</Badge>
              </div>

              <p className="whitespace-pre-wrap text-sm">{s.mensaje}</p>

              {s.estado === "PENDIENTE" ? (
                <div className="flex flex-col gap-2 border-t border-border pt-3">
                  <Textarea
                    placeholder="Nota opcional (qué se hizo o por qué se rechaza)"
                    value={notas[s.id] ?? ""}
                    onChange={(e) => setNotas((n) => ({ ...n, [s.id]: e.target.value }))}
                  />
                  <div className="flex gap-2">
                    <Link href={`/admin/extensions/${s.extensionId}`}>
                      <Button variant="outline" size="sm">
                        Editar extensión
                      </Button>
                    </Link>
                    <Button size="sm" onClick={() => resolver(s.id, "APLICADA")}>
                      Marcar aplicada
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => resolver(s.id, "RECHAZADA")}>
                      Rechazar
                    </Button>
                  </div>
                </div>
              ) : (
                s.notaAdmin && (
                  <p className="border-t border-border pt-2 text-sm text-muted">
                    Nota de {s.usuarioResolvio?.nombre}: {s.notaAdmin}
                  </p>
                )
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
