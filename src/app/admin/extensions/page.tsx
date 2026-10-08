"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { EstadoBadge } from "@/components/ui/badge";
import { extensionesService } from "@/services/extensiones.service";
import type { Extension } from "@/types/entities";
import { NuevaExtensionForm } from "@/components/admin/nueva-extension-form";
import { CompletarUbicacionBanner } from "@/components/admin/completar-ubicacion-banner";

const PAGE_SIZE = 20;

export default function AdminExtensionsPage() {
  const [items, setItems] = useState<Extension[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("");
  const [sortBy, setSortBy] = useState("numero");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [cargando, setCargando] = useState(false);

  async function cargar() {
    setCargando(true);
    try {
      const res = await extensionesService.listar({
        q: q || undefined,
        estado: estado || undefined,
        page,
        pageSize: PAGE_SIZE,
        sortBy,
        sortDir,
        incluirInactivos: true,
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudieron cargar las extensiones.");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, q, estado, sortBy, sortDir]);

  function alternarOrden(campo: string) {
    if (sortBy === campo) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(campo);
      setSortDir("asc");
    }
  }

  async function desactivar(id: string, numero: string) {
    if (!confirm(`¿Desactivar la extensión ${numero}?`)) return;
    try {
      await extensionesService.desactivar(id);
      toast.success(`Extensión ${numero} desactivada.`);
      cargar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo desactivar.");
    }
  }

  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Extensiones</h1>
        <Button size="sm" onClick={() => setMostrarForm((v) => !v)}>
          {mostrarForm ? "Cancelar" : "+ Nueva extensión"}
        </Button>
      </div>

      {mostrarForm && (
        <NuevaExtensionForm
          onCreada={() => {
            setMostrarForm(false);
            cargar();
          }}
        />
      )}

      <CompletarUbicacionBanner onCompletado={cargar} />

      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Buscar por número u observaciones…"
          value={q}
          onChange={(e) => {
            setPage(1);
            setQ(e.target.value);
          }}
          className="max-w-xs"
        />
        <Select
          value={estado}
          onChange={(e) => {
            setPage(1);
            setEstado(e.target.value);
          }}
          className="max-w-[200px]"
        >
          <option value="">Todos los estados</option>
          <option value="ACTIVA">Activa</option>
          <option value="SIN_ASIGNAR">Sin asignar</option>
          <option value="MANTENIMIENTO">Mantenimiento</option>
          <option value="RESERVADA">Reservada</option>
          <option value="INACTIVA">Inactiva</option>
        </Select>
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted-bg text-left">
              <tr>
                <Th onClick={() => alternarOrden("numero")}>Extensión</Th>
                <th className="px-3 py-2">Área</th>
                <th className="px-3 py-2">Persona(s)</th>
                <th className="px-3 py-2">Ubicación</th>
                <Th onClick={() => alternarOrden("estado")}>Estado</Th>
                <th className="px-3 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((ext) => {
                const principal = ext.asignaciones[0];
                return (
                  <tr key={ext.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-2 font-semibold">{ext.numero}</td>
                    <td className="px-3 py-2">{principal?.area?.nombre ?? "—"}</td>
                    <td className="px-3 py-2">
                      {ext.asignaciones.filter((a) => a.persona).map((a) => a.persona!.nombreCompleto).join(", ") || "—"}
                    </td>
                    <td className="px-3 py-2">
                      {principal?.ubicacion
                        ? `${principal.ubicacion.tipo} ${principal.ubicacion.nombre ?? principal.ubicacion.numero ?? ""}`
                        : "—"}
                    </td>
                    <td className="px-3 py-2">
                      <EstadoBadge estado={ext.estado} />
                    </td>
                    <td className="flex flex-wrap gap-2 px-3 py-2">
                      <Link href={`/extensions/${ext.id}`} className="text-accent hover:underline">
                        Ver
                      </Link>
                      <Link href={`/admin/extensions/${ext.id}`} className="text-accent hover:underline">
                        Editar
                      </Link>
                      {ext.activo && (
                        <button
                          onClick={() => desactivar(ext.id, ext.numero)}
                          className="text-danger hover:underline"
                        >
                          Desactivar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!cargando && items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-muted">
                    No hay extensiones que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-sm text-muted">
        <span>{total} extensión(es)</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </Button>
          <span className="py-1.5">
            Página {page} de {totalPaginas}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPaginas}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
}

function Th({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <th className="cursor-pointer select-none px-3 py-2 hover:text-accent" onClick={onClick}>
      {children}
    </th>
  );
}
