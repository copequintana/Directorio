-- AlterTable
ALTER TABLE "campus" ADD COLUMN     "mapaUrl" TEXT;

-- AlterTable
ALTER TABLE "edificios" ADD COLUMN     "mapaX" DOUBLE PRECISION,
ADD COLUMN     "mapaY" DOUBLE PRECISION;
