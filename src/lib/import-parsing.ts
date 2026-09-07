import ExcelJS from "exceljs";
import Papa from "papaparse";
import { IMPORT_COLUMNS, importRowSchema, type ImportRow } from "@/server/domain/importacion";
import { ESTADOS_EXTENSION } from "@/server/domain/extension";

function normalizarEncabezado(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

const CLAVE_POR_ENCABEZADO = new Map(
  IMPORT_COLUMNS.map((columna) => [normalizarEncabezado(columna.header), columna.key]),
);

function filaDesdeCeldas(encabezados: string[], celdas: string[]): ImportRow {
  const registro: Record<string, string> = {};
  encabezados.forEach((encabezado, index) => {
    const clave = CLAVE_POR_ENCABEZADO.get(normalizarEncabezado(encabezado));
    if (clave) registro[clave] = celdas[index]?.trim() ?? "";
  });

  // Un valor de Estado no reconocido no debe tumbar el archivo completo:
  // se deja en blanco y el servicio de importación usará el estado por
  // defecto (SIN_ASIGNAR / ACTIVA según corresponda).
  const estadoNormalizado = registro.estado?.trim().toUpperCase() ?? "";
  if (!(ESTADOS_EXTENSION as readonly string[]).includes(estadoNormalizado)) {
    registro.estado = "";
  } else {
    registro.estado = estadoNormalizado;
  }

  return importRowSchema.parse(registro);
}

async function parseXlsx(buffer: ArrayBuffer): Promise<ImportRow[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const hoja = workbook.worksheets[0];
  if (!hoja) return [];

  let encabezados: string[] = [];
  const filas: ImportRow[] = [];

  hoja.eachRow((row, rowNumber) => {
    const celdas = (row.values as (string | number | null)[]).slice(1).map((v) => String(v ?? ""));
    if (rowNumber === 1) {
      encabezados = celdas;
      return;
    }
    if (celdas.every((c) => !c.trim())) return;
    filas.push(filaDesdeCeldas(encabezados, celdas));
  });

  return filas;
}

function parseCsv(texto: string): ImportRow[] {
  const resultado = Papa.parse<string[]>(texto.trim(), { skipEmptyLines: true });
  const [encabezados, ...filasCrudas] = resultado.data;
  if (!encabezados) return [];

  return filasCrudas
    .filter((fila) => fila.some((celda) => celda?.trim()))
    .map((fila) => filaDesdeCeldas(encabezados, fila));
}

/** Convierte un archivo .xlsx/.csv subido al formato normalizado de importación (spec sección 16). */
export async function parseArchivoImportacion(
  archivo: File,
): Promise<ImportRow[]> {
  const buffer = await archivo.arrayBuffer();
  const esCsv = archivo.name.toLowerCase().endsWith(".csv") || archivo.type === "text/csv";

  if (esCsv) {
    return parseCsv(new TextDecoder("utf-8").decode(buffer));
  }
  return parseXlsx(buffer);
}
