import { z } from "zod";
import { ESTADOS_EXTENSION } from "./extension";

/** Formato normalizado de importación (spec sección 16), una fila = un renglón del archivo. */
export const importRowSchema = z.object({
  campus: z.string().optional().default(""),
  edificio: z.string().optional().default(""),
  area: z.string().optional().default(""),
  subarea: z.string().optional().default(""),
  tipoUbicacion: z.string().optional().default(""),
  ubicacion: z.string().optional().default(""),
  personaNombre: z.string().optional().default(""),
  personaApellidoPaterno: z.string().optional().default(""),
  personaApellidoMaterno: z.string().optional().default(""),
  puesto: z.string().optional().default(""),
  // Se permite vacío a propósito: una fila sin número de extensión no debe
  // tumbar el análisis completo del archivo, sino marcarse como problema
  // (CAMPO_REQUERIDO_FALTANTE) para que el administrador la vea en la vista
  // previa antes de decidir qué hacer con ella.
  extension: z.string().optional().default(""),
  estado: z.enum([...ESTADOS_EXTENSION, ""]).optional().default(""),
  observaciones: z.string().optional().default(""),
});
export type ImportRow = z.infer<typeof importRowSchema>;

/** Columnas esperadas en el archivo, en este orden (encabezados, sin acentos para robustez). */
export const IMPORT_COLUMNS: { key: keyof ImportRow; header: string }[] = [
  { key: "campus", header: "Campus" },
  { key: "edificio", header: "Edificio" },
  { key: "area", header: "Area" },
  { key: "subarea", header: "Subarea" },
  { key: "tipoUbicacion", header: "TipoUbicacion" },
  { key: "ubicacion", header: "Ubicacion" },
  { key: "personaNombre", header: "PersonaNombre" },
  { key: "personaApellidoPaterno", header: "PersonaApellidoPaterno" },
  { key: "personaApellidoMaterno", header: "PersonaApellidoMaterno" },
  { key: "puesto", header: "Puesto" },
  { key: "extension", header: "Extension" },
  { key: "estado", header: "Estado" },
  { key: "observaciones", header: "Observaciones" },
];

export type ProblemaFila =
  | "EXTENSION_DUPLICADA_EN_ARCHIVO"
  | "EXTENSION_YA_EXISTE"
  | "PERSONA_POSIBLEMENTE_DUPLICADA"
  | "CAMPO_REQUERIDO_FALTANTE"
  | "UBICACION_AMBIGUA";

export interface ImportRowAnalysis {
  fila: number;
  datos: ImportRow;
  accion: "CREAR" | "ACTUALIZAR";
  problemas: { tipo: ProblemaFila; mensaje: string }[];
}

export interface ImportPreview {
  totalFilas: number;
  filasConProblemas: number;
  filasNuevas: number;
  filasActualizar: number;
  filas: ImportRowAnalysis[];
}

export const importAnalyzeRequestSchema = z.object({
  filas: z.array(importRowSchema).min(1, "El archivo no contiene filas"),
});

export const importConfirmRequestSchema = z.object({
  // Solo se confirman las filas sin problemas bloqueantes; el cliente reenvía
  // exactamente lo que el usuario aprobó en la vista previa.
  filas: z.array(importRowSchema).min(1, "No hay filas para importar"),
});
