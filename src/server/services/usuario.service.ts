import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import type { RolUsuario } from "@/server/domain/usuario";

const SALT_ROUNDS = 12;

export interface UsuarioAutenticado {
  id: string;
  nombre: string;
  correo: string;
  rol: RolUsuario;
}

export async function autenticarUsuario(
  correo: string,
  password: string,
): Promise<UsuarioAutenticado | null> {
  const usuario = await prisma.usuario.findUnique({ where: { correo } });
  if (!usuario || !usuario.activo) return null;

  const valido = await bcrypt.compare(password, usuario.passwordHash);
  if (!valido) return null;

  return {
    id: usuario.id,
    nombre: usuario.nombre,
    correo: usuario.correo,
    rol: usuario.rol as RolUsuario,
  };
}

export async function crearUsuario(input: {
  nombre: string;
  correo: string;
  password: string;
  rol: RolUsuario;
}) {
  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  return prisma.usuario.upsert({
    where: { correo: input.correo },
    update: {},
    create: {
      nombre: input.nombre,
      correo: input.correo,
      passwordHash,
      rol: input.rol,
    },
  });
}
