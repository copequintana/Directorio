-- CreateEnum
CREATE TYPE "EstadoSolicitud" AS ENUM ('PENDIENTE', 'APLICADA', 'RECHAZADA');

-- CreateTable
CREATE TABLE "solicitudes_cambio" (
    "id" TEXT NOT NULL,
    "extensionId" TEXT NOT NULL,
    "nombreSolicitante" TEXT NOT NULL,
    "correoSolicitante" TEXT,
    "mensaje" TEXT NOT NULL,
    "estado" "EstadoSolicitud" NOT NULL DEFAULT 'PENDIENTE',
    "notaAdmin" TEXT,
    "usuarioResolvioId" TEXT,
    "fechaResolucion" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "solicitudes_cambio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "solicitudes_cambio_extensionId_idx" ON "solicitudes_cambio"("extensionId");

-- CreateIndex
CREATE INDEX "solicitudes_cambio_estado_idx" ON "solicitudes_cambio"("estado");

-- AddForeignKey
ALTER TABLE "solicitudes_cambio" ADD CONSTRAINT "solicitudes_cambio_extensionId_fkey" FOREIGN KEY ("extensionId") REFERENCES "extensiones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_cambio" ADD CONSTRAINT "solicitudes_cambio_usuarioResolvioId_fkey" FOREIGN KEY ("usuarioResolvioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
