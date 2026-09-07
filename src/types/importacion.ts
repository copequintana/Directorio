// Re-exporta los tipos (no los schemas de Zod) del dominio de importación
// para que el código de cliente los importe desde `types/` como el resto de
// las entidades, sin arrastrar los validadores de servidor innecesariamente.
export type {
  ImportRow,
  ImportPreview,
  ImportRowAnalysis,
  ProblemaFila,
} from "@/server/domain/importacion";
export { IMPORT_COLUMNS } from "@/server/domain/importacion";
