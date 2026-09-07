-- CreateEnum
CREATE TYPE "TipoUbicacion" AS ENUM ('OFICINA', 'CUBICULO', 'AULA', 'VENTANILLA', 'LABORATORIO', 'SITE', 'AREA', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoExtension" AS ENUM ('ACTIVA', 'INACTIVA', 'SIN_ASIGNAR', 'MANTENIMIENTO', 'RESERVADA');

-- CreateEnum
CREATE TYPE "TipoAsignacion" AS ENUM ('INDIVIDUAL', 'COMPARTIDA', 'AREA_SERVICIO', 'SIN_PERSONA');

-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('ADMINISTRADOR', 'CAPTURISTA', 'CONSULTA');

-- CreateEnum
CREATE TYPE "AccionHistorial" AS ENUM ('CREAR', 'ACTUALIZAR', 'DESACTIVAR', 'ASIGNAR', 'DESASIGNAR', 'IMPORTAR');

-- CreateTable
CREATE TABLE "campus" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "edificios" (
    "id" TEXT NOT NULL,
    "campusId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "clave" TEXT,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "edificios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ubicaciones" (
    "id" TEXT NOT NULL,
    "edificioId" TEXT,
    "tipo" "TipoUbicacion" NOT NULL,
    "nombre" TEXT,
    "numero" TEXT,
    "piso" TEXT,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ubicaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "areas" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "areaPadreId" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "puestos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "puestos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personas" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellidoPaterno" TEXT,
    "apellidoMaterno" TEXT,
    "nombreCompleto" TEXT NOT NULL,
    "correo" TEXT,
    "puestoId" TEXT,
    "areaId" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "extensiones" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "tipo" TEXT,
    "estado" "EstadoExtension" NOT NULL DEFAULT 'SIN_ASIGNAR',
    "observaciones" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "extensiones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asignaciones_extension" (
    "id" TEXT NOT NULL,
    "extensionId" TEXT NOT NULL,
    "personaId" TEXT,
    "areaId" TEXT,
    "ubicacionId" TEXT,
    "tipoAsignacion" "TipoAsignacion" NOT NULL DEFAULT 'INDIVIDUAL',
    "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaFin" TIMESTAMP(3),
    "esPrincipal" BOOLEAN NOT NULL DEFAULT true,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asignaciones_extension_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rol" "RolUsuario" NOT NULL DEFAULT 'CONSULTA',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historial_cambios" (
    "id" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidadId" TEXT NOT NULL,
    "accion" "AccionHistorial" NOT NULL,
    "valoresAnteriores" JSONB,
    "valoresNuevos" JSONB,
    "usuarioId" TEXT,
    "loteId" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historial_cambios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "campus_clave_key" ON "campus"("clave");

-- CreateIndex
CREATE INDEX "edificios_campusId_idx" ON "edificios"("campusId");

-- CreateIndex
CREATE INDEX "ubicaciones_edificioId_idx" ON "ubicaciones"("edificioId");

-- CreateIndex
CREATE INDEX "ubicaciones_tipo_idx" ON "ubicaciones"("tipo");

-- CreateIndex
CREATE INDEX "areas_areaPadreId_idx" ON "areas"("areaPadreId");

-- CreateIndex
CREATE UNIQUE INDEX "puestos_nombre_key" ON "puestos"("nombre");

-- CreateIndex
CREATE INDEX "personas_nombreCompleto_idx" ON "personas"("nombreCompleto");

-- CreateIndex
CREATE INDEX "personas_apellidoPaterno_idx" ON "personas"("apellidoPaterno");

-- CreateIndex
CREATE INDEX "personas_areaId_idx" ON "personas"("areaId");

-- CreateIndex
CREATE INDEX "personas_puestoId_idx" ON "personas"("puestoId");

-- CreateIndex
CREATE UNIQUE INDEX "extensiones_numero_key" ON "extensiones"("numero");

-- CreateIndex
CREATE INDEX "extensiones_estado_idx" ON "extensiones"("estado");

-- CreateIndex
CREATE INDEX "asignaciones_extension_extensionId_idx" ON "asignaciones_extension"("extensionId");

-- CreateIndex
CREATE INDEX "asignaciones_extension_personaId_idx" ON "asignaciones_extension"("personaId");

-- CreateIndex
CREATE INDEX "asignaciones_extension_areaId_idx" ON "asignaciones_extension"("areaId");

-- CreateIndex
CREATE INDEX "asignaciones_extension_ubicacionId_idx" ON "asignaciones_extension"("ubicacionId");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_correo_key" ON "usuarios"("correo");

-- CreateIndex
CREATE INDEX "historial_cambios_entidad_entidadId_idx" ON "historial_cambios"("entidad", "entidadId");

-- CreateIndex
CREATE INDEX "historial_cambios_fecha_idx" ON "historial_cambios"("fecha");

-- CreateIndex
CREATE INDEX "historial_cambios_loteId_idx" ON "historial_cambios"("loteId");

-- AddForeignKey
ALTER TABLE "edificios" ADD CONSTRAINT "edificios_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ubicaciones" ADD CONSTRAINT "ubicaciones_edificioId_fkey" FOREIGN KEY ("edificioId") REFERENCES "edificios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "areas" ADD CONSTRAINT "areas_areaPadreId_fkey" FOREIGN KEY ("areaPadreId") REFERENCES "areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personas" ADD CONSTRAINT "personas_puestoId_fkey" FOREIGN KEY ("puestoId") REFERENCES "puestos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personas" ADD CONSTRAINT "personas_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones_extension" ADD CONSTRAINT "asignaciones_extension_extensionId_fkey" FOREIGN KEY ("extensionId") REFERENCES "extensiones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones_extension" ADD CONSTRAINT "asignaciones_extension_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "personas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones_extension" ADD CONSTRAINT "asignaciones_extension_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones_extension" ADD CONSTRAINT "asignaciones_extension_ubicacionId_fkey" FOREIGN KEY ("ubicacionId") REFERENCES "ubicaciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_cambios" ADD CONSTRAINT "historial_cambios_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
