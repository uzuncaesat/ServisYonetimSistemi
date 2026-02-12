-- CreateTable: Organization
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "trialEndsAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "maxVehicles" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- AlterTable: Add organizationId to User
ALTER TABLE "User" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "User" ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "verificationCode" TEXT;
ALTER TABLE "User" ADD COLUMN "verificationExpires" TIMESTAMP(3);

-- AlterTable: Add organizationId to Supplier
ALTER TABLE "Supplier" ADD COLUMN "organizationId" TEXT;

-- AlterTable: Add organizationId to Driver
ALTER TABLE "Driver" ADD COLUMN "organizationId" TEXT;

-- AlterTable: Add organizationId to Vehicle
ALTER TABLE "Vehicle" ADD COLUMN "organizationId" TEXT;

-- AlterTable: Add organizationId to Project
ALTER TABLE "Project" ADD COLUMN "organizationId" TEXT;

-- AlterTable: Modify Setting to be org-scoped
ALTER TABLE "Setting" ADD COLUMN "organizationId" TEXT;

-- Drop old unique constraint on Setting.key and add composite unique
DROP INDEX IF EXISTS "Setting_key_key";
CREATE UNIQUE INDEX "Setting_key_organizationId_key" ON "Setting"("key", "organizationId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Project" ADD CONSTRAINT "Project_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Setting" ADD CONSTRAINT "Setting_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create indexes for organizationId columns
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");
CREATE INDEX "Supplier_organizationId_idx" ON "Supplier"("organizationId");
CREATE INDEX "Driver_organizationId_idx" ON "Driver"("organizationId");
CREATE INDEX "Vehicle_organizationId_idx" ON "Vehicle"("organizationId");
CREATE INDEX "Project_organizationId_idx" ON "Project"("organizationId");

-- Create a default organization for existing data
INSERT INTO "Organization" ("id", "name", "slug", "plan", "isActive", "maxVehicles", "createdAt", "updatedAt")
VALUES ('default-org', 'Varsayılan Organizasyon', 'default', 'enterprise', true, 9999, NOW(), NOW());

-- Assign existing data to default organization
UPDATE "User" SET "organizationId" = 'default-org' WHERE "organizationId" IS NULL;
UPDATE "Supplier" SET "organizationId" = 'default-org' WHERE "organizationId" IS NULL;
UPDATE "Driver" SET "organizationId" = 'default-org' WHERE "organizationId" IS NULL;
UPDATE "Vehicle" SET "organizationId" = 'default-org' WHERE "organizationId" IS NULL;
UPDATE "Project" SET "organizationId" = 'default-org' WHERE "organizationId" IS NULL;
UPDATE "Setting" SET "organizationId" = 'default-org' WHERE "organizationId" IS NULL;
