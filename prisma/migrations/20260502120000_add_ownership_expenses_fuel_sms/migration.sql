-- Vehicle: ownership alanı ekle, supplierId'yi nullable yap
ALTER TABLE "Vehicle" ADD COLUMN "ownership" TEXT NOT NULL DEFAULT 'RENTED';
ALTER TABLE "Vehicle" ALTER COLUMN "supplierId" DROP NOT NULL;

-- VehicleExpense tablosu
CREATE TABLE "VehicleExpense" (
    "id" TEXT NOT NULL,
    "tarih" TIMESTAMP(3) NOT NULL,
    "kategori" TEXT NOT NULL,
    "altKategori" TEXT,
    "tutar" DOUBLE PRECISION NOT NULL,
    "kdvDahil" BOOLEAN NOT NULL DEFAULT true,
    "km" INTEGER,
    "saglayici" TEXT,
    "belgeNo" TEXT,
    "garantiBitis" TIMESTAMP(3),
    "notlar" TEXT,
    "fisUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT,
    "vehicleId" TEXT NOT NULL,

    CONSTRAINT "VehicleExpense_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "VehicleExpense_organizationId_idx" ON "VehicleExpense"("organizationId");
CREATE INDEX "VehicleExpense_vehicleId_idx" ON "VehicleExpense"("vehicleId");
CREATE INDEX "VehicleExpense_tarih_idx" ON "VehicleExpense"("tarih");

ALTER TABLE "VehicleExpense" ADD CONSTRAINT "VehicleExpense_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VehicleExpense" ADD CONSTRAINT "VehicleExpense_vehicleId_fkey"
    FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- FuelEntry tablosu
CREATE TABLE "FuelEntry" (
    "id" TEXT NOT NULL,
    "tarih" TIMESTAMP(3) NOT NULL,
    "yakitTipi" TEXT NOT NULL,
    "litre" DOUBLE PRECISION NOT NULL,
    "birimFiyat" DOUBLE PRECISION NOT NULL,
    "toplamTutar" DOUBLE PRECISION NOT NULL,
    "km" INTEGER NOT NULL,
    "istasyon" TEXT,
    "fisNo" TEXT,
    "fisUrl" TEXT,
    "notlar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT,
    "vehicleId" TEXT NOT NULL,

    CONSTRAINT "FuelEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FuelEntry_organizationId_idx" ON "FuelEntry"("organizationId");
CREATE INDEX "FuelEntry_vehicleId_idx" ON "FuelEntry"("vehicleId");
CREATE INDEX "FuelEntry_tarih_idx" ON "FuelEntry"("tarih");

ALTER TABLE "FuelEntry" ADD CONSTRAINT "FuelEntry_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FuelEntry" ADD CONSTRAINT "FuelEntry_vehicleId_fkey"
    FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- SmsLog tablosu
CREATE TABLE "SmsLog" (
    "id" TEXT NOT NULL,
    "alici" TEXT NOT NULL,
    "aliciAdi" TEXT,
    "mesaj" TEXT NOT NULL,
    "durum" TEXT NOT NULL DEFAULT 'PENDING',
    "saglayici" TEXT,
    "saglayiciId" TEXT,
    "hata" TEXT,
    "tetikleyici" TEXT,
    "gonderenId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizationId" TEXT,

    CONSTRAINT "SmsLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SmsLog_organizationId_idx" ON "SmsLog"("organizationId");
CREATE INDEX "SmsLog_createdAt_idx" ON "SmsLog"("createdAt");
CREATE INDEX "SmsLog_durum_idx" ON "SmsLog"("durum");

ALTER TABLE "SmsLog" ADD CONSTRAINT "SmsLog_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
