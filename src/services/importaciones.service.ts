import { ApiClientError } from "@/lib/api-client";
import { api } from "@/lib/api-client";
import type { ImportPreview, ImportRow } from "@/types/importacion";

export interface ResultadoImportacion {
  loteId: string;
  creadas: number;
  actualizadas: number;
  omitidas: number;
}

export const importacionesService = {
  async analizarArchivo(archivo: File) {
    const formData = new FormData();
    formData.append("file", archivo);
    const res = await fetch("/api/importaciones/analizar-archivo", {
      method: "POST",
      body: formData,
    });
    const body = await res.json().catch(() => null);
    if (!res.ok || !body?.success) {
      throw new ApiClientError(body?.message ?? "No se pudo analizar el archivo.");
    }
    return body.data as { filas: ImportRow[]; preview: ImportPreview };
  },
  confirmar: (filas: ImportRow[]) =>
    api.post<ResultadoImportacion>("/api/importaciones/confirmar", { filas }),
};
