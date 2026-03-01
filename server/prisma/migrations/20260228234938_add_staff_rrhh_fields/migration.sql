-- AlterTable
ALTER TABLE "health_staff" ADD COLUMN     "collegiateBody" TEXT,
ADD COLUMN     "collegiateExpiresAt" TIMESTAMP(3),
ADD COLUMN     "collegiateStatus" TEXT,
ADD COLUMN     "contractEndDate" TIMESTAMP(3),
ADD COLUMN     "contractStartDate" TIMESTAMP(3),
ADD COLUMN     "dniNumber" TEXT,
ADD COLUMN     "serumsCycle" TEXT,
ADD COLUMN     "specialtyArea" TEXT,
ADD COLUMN     "weeklyHours" INTEGER DEFAULT 36,
ADD COLUMN     "workShift" TEXT;
