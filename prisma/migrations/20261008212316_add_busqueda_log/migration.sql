-- CreateTable
CREATE TABLE "busquedas_log" (
    "id" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "resultados" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "busquedas_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "busquedas_log_fecha_idx" ON "busquedas_log"("fecha");

-- CreateIndex
CREATE INDEX "busquedas_log_texto_idx" ON "busquedas_log"("texto");
