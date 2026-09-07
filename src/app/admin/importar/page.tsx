"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { importacionesService, type ResultadoImportacion } from "@/services/importaciones.service";
import type { ImportPreview, ImportRow } from "@/types/importacion";

const PROBLEMAS_BLOQUEANTES = new Set(["CAMPO_REQUERIDO_FALTANTE", "EXTENSION_DUPLICADA_EN_ARCHIVO"]);

export default function AdminImportarPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [filas, setFilas] = useState<ImportRow[] | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [analizando, setAnalizando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoImportacion | null>(null);

  async function onArchivoSeleccionado(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    setAnalizando(true);
    setResultado(null);
    try {
      const { filas: filasParseadas, preview: previewCalculado } =
        await importacionesService.analizarArchivo(archivo);
      setFilas(filasParseadas);
      setPreview(previewCalculado);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo analizar el archivo.");
      setFilas(null);
      setPreview(null);
    } finally {
      setAnalizando(false);
    }
  }

  const tieneBloqueantes = preview?.filas.some((f) =>
    f.problemas.some((p) => PROBLEMAS_BLOQUEANTES.has(p.tipo)),
  );

  async function confirmar() {
    if (!filas) return;
    setConfirmando(true);
    try {
      const res = await importacionesService.confirmar(filas);
      setResultado(res);
      toast.success("Importación completada.");
      setFilas(null);
      setPreview(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo confirmar la importación.");
    } finally {
      setConfirmando(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Importar extensiones</h1>
      <p className="text-sm text-muted">
        Sube un archivo .xlsx o .csv con el formato normalizado (ver docs/API.md). Se muestra una
        vista previa con los problemas detectados antes de guardar cualquier cambio.
      </p>

      <Card>
        <CardContent className="flex flex-col gap-3">
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={onArchivoSeleccionado}
            disabled={analizando}
          />
          {analizando && <p className="text-sm text-muted">Analizando archivo…</p>}
        </CardContent>
      </Card>

      {resultado && (
        <Card>
          <CardContent>
            <p className="font-medium">Importación completada</p>
            <p className="text-sm text-muted">
              {resultado.creadas} nuevas · {resultado.actualizadas} actualizadas · {resultado.omitidas} omitidas ·
              lote {resultado.loteId}
            </p>
          </CardContent>
        </Card>
      )}

      {preview && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              Vista previa: {preview.totalFilas} filas · {preview.filasNuevas} nuevas ·{" "}
              {preview.filasActualizar} a actualizar · {preview.filasConProblemas} con observaciones
            </CardTitle>
            <Button onClick={confirmar} disabled={confirmando || tieneBloqueantes}>
              {confirmando ? "Guardando…" : "Confirmar importación"}
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            {tieneBloqueantes && (
              <p className="p-3 text-sm text-danger">
                Hay filas con problemas que impiden importar (extensión faltante o duplicada dentro
                del archivo). Corrige el archivo y vuelve a subirlo.
              </p>
            )}
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted-bg text-left">
                <tr>
                  <th className="px-3 py-2">Fila</th>
                  <th className="px-3 py-2">Extensión</th>
                  <th className="px-3 py-2">Persona</th>
                  <th className="px-3 py-2">Acción</th>
                  <th className="px-3 py-2">Observaciones</th>
                </tr>
              </thead>
              <tbody>
                {preview.filas.map((f) => (
                  <tr key={f.fila} className="border-b border-border last:border-0 align-top">
                    <td className="px-3 py-2">{f.fila}</td>
                    <td className="px-3 py-2 font-medium">{f.datos.extension || "—"}</td>
                    <td className="px-3 py-2">
                      {[f.datos.personaNombre, f.datos.personaApellidoPaterno].filter(Boolean).join(" ") || "—"}
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant={f.accion === "CREAR" ? "success" : "neutral"}>{f.accion}</Badge>
                    </td>
                    <td className="px-3 py-2">
                      {f.problemas.length === 0 ? (
                        <span className="text-muted">—</span>
                      ) : (
                        <ul className="flex flex-col gap-1">
                          {f.problemas.map((p, i) => (
                            <li key={i}>
                              <Badge variant={PROBLEMAS_BLOQUEANTES.has(p.tipo) ? "danger" : "warning"}>
                                {p.mensaje}
                              </Badge>
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
