import { z } from "zod";

// nombreCompleto se acepta opcionalmente en la entrada (p.ej. datos de
// importación que ya vienen como un solo bloque de texto); si no se
// proporciona, el servicio lo compone a partir de nombre/apellidos.
export const personaInputSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  apellidoPaterno: z.string().optional().nullable(),
  apellidoMaterno: z.string().optional().nullable(),
  nombreCompleto: z.string().optional(),
  correo: z.email("Correo inválido").optional().nullable().or(z.literal("")),
  puestoId: z.string().min(1).optional().nullable(),
  areaId: z.string().min(1).optional().nullable(),
  activo: z.boolean().default(true),
});
export type PersonaInput = z.infer<typeof personaInputSchema>;

export function construirNombreCompleto(input: {
  nombre: string;
  apellidoPaterno?: string | null;
  apellidoMaterno?: string | null;
}): string {
  return [input.nombre, input.apellidoPaterno, input.apellidoMaterno]
    .filter((parte) => !!parte && parte.trim().length > 0)
    .join(" ")
    .trim();
}
