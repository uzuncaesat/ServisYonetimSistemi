-- AlterTable: Add approval fields to ExtraWork
ALTER TABLE "ExtraWork" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL';
ALTER TABLE "ExtraWork" ADD COLUMN "approvedById" TEXT;
ALTER TABLE "ExtraWork" ADD COLUMN "approvedAt" TIMESTAMP(3);

-- Existing rows: treat as already approved so they stay in reports
UPDATE "ExtraWork" SET "status" = 'APPROVED' WHERE "status" = 'PENDING_APPROVAL';

-- AddForeignKey
ALTER TABLE "ExtraWork" ADD CONSTRAINT "ExtraWork_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
