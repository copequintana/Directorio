import "dotenv/config";
import { prisma } from "@/lib/db/prisma";
import { crearUsuario } from "@/server/services/usuario.service";
import { confirmarImportacion } from "@/server/services/importacion.service";
import { FILAS_SEED } from "./seed-data";

async function main() {
  const passwordInicial = process.env.SEED_ADMIN_PASSWORD ?? "ITSON-directorio-2026!";

  const admin = await crearUsuario({
    nombre: "Administrador",
    correo: "admin@itson.edu.mx",
    password: passwordInicial,
    rol: "ADMINISTRADOR",
  });

  console.log(`Usuario administrador listo: ${admin.correo}`);
  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.log(
      `Contraseña inicial (cámbiala después de iniciar sesión): ${passwordInicial}`,
    );
  }

  const resultado = await confirmarImportacion(FILAS_SEED, admin.id);
  console.log(
    `Datos iniciales importados: ${resultado.creadas} extensiones creadas, ` +
      `${resultado.actualizadas} actualizadas, ${resultado.omitidas} omitidas (lote ${resultado.loteId}).`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
