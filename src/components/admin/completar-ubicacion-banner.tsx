"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { asignacionesService } from "@/services/asignaciones.service";
import { ubicacionesService } from "@/services/catalogos.service";
import { compararUbicaciones, formatUbicacion } from "@/lib/format";
import type { Ubicacion } from "@/types/entities";

/**
 * Cierra la brecha de asignaciones sin ubicación en bloque, asignándoles un
 * marcador explícito (p. ej. "Ubicación desconocida") en vez de dejarlas
 * pendientes indefinidamente. Solo aparece cuando hay algo que hacer.
 */
export function CompletarUbicacionBanner({ onCompletado }: { onCompletado: () => void }) {
  const [pendientes, setPendientes] = useState<number | null>(null);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [ubicacionId, setUbicacionId] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function cargar() {
    try {
      const [{ pendientes: n }, lista] = await Promise.all([
        asignacionesService.contarSinUbicacion(),
        ubicacionesService.listar(),
      ]);
      setPendientes(n);
      setUbicaciones(lista);
      const desconocida = lista.find((u) => u.nombre?.toLowerCase().includes("desconocid"));
      if (desconocida) setUbicacionId((actual) => actual || desconocida.id);
    } catch {
      // Silencioso: es un banner de ayuda, no bloquea el resto de la página.
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
  }, []);

  async function completar() {
    if (!ubicacionId) {
      toast.error("Elige qué ubicación usar.");
      return;
    }
    if (!confirm(`¿Asignar esta ubicación a las ${pendientes} asignaciones que no tienen ninguna?`)) return;

    setEnviando(true);
    try {
      const { actualizadas } = await asignacionesService.completarUbicacion(ubicacionId);
      toast.success(`${actualizadas} asignación(es) actualizadas.`);
      onCompletado();
      cargar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo completar.");
    } finally {
      setEnviando(false);
    }
  }

  if (!pendientes) return null;

  return (
    <Card className="border-warning">
      <CardContent className="flex flex-wrap items-center gap-3">
        <p className="text-sm">
          <strong>{pendientes}</strong> asignación(es) activas no tienen ninguna ubicación.
        </p>
        <Select value={ubicacionId} onChange={(e) => setUbicacionId(e.target.value)} className="w-64">
          <option value="">Elige una ubicación…</option>
          {[...ubicaciones].sort(compararUbicaciones).map((u) => (
            <option key={u.id} value={u.id}>
              {formatUbicacion(u)}
            </option>
          ))}
        </Select>
        <Button size="sm" variant="outline" onClick={completar} disabled={enviando}>
          {enviando ? "Asignando…" : "Asignar a todas"}
        </Button>
      </CardContent>
    </Card>
  );
}
