import { z } from "zod";

export const ROLES_USUARIO = ["ADMINISTRADOR", "CAPTURISTA", "CONSULTA"] as const;
export type RolUsuario = (typeof ROLES_USUARIO)[number];

export const loginSchema = z.object({
  correo: z.email("Correo inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const usuarioInputSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  correo: z.email("Correo inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  rol: z.enum(ROLES_USUARIO).default("CONSULTA"),
  activo: z.boolean().default(true),
});
export type UsuarioInput = z.infer<typeof usuarioInputSchema>;

/** Jerarquía de permisos: cada rol puede hacer lo que el/los roles a su derecha pueden. */
export const JERARQUIA_ROLES: Record<RolUsuario, number> = {
  CONSULTA: 0,
  CAPTURISTA: 1,
  ADMINISTRADOR: 2,
};

export function tieneRolSuficiente(rolActual: RolUsuario, rolMinimo: RolUsuario): boolean {
  return JERARQUIA_ROLES[rolActual] >= JERARQUIA_ROLES[rolMinimo];
}
