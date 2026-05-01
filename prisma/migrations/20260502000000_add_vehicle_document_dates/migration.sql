-- AlterTable: Add document expiry date fields to Vehicle
ALTER TABLE "Vehicle" ADD COLUMN "ruhsatBitis" TIMESTAMP(3);
ALTER TABLE "Vehicle" ADD COLUMN "sigortaBitis" TIMESTAMP(3);
ALTER TABLE "Vehicle" ADD COLUMN "muayeneBitis" TIMESTAMP(3);
ALTER TABLE "Vehicle" ADD COLUMN "koltukSigortasiBitis" TIMESTAMP(3);
ALTER TABLE "Vehicle" ADD COLUMN "calismaRuhsatiBitis" TIMESTAMP(3);
