-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "chiefComplaint" TEXT,
ADD COLUMN     "consultorio" TEXT,
ADD COLUMN     "diagnosisCodes" JSONB,
ADD COLUMN     "estimatedDuration" INTEGER,
ADD COLUMN     "financiador" TEXT,
ADD COLUMN     "hisLinked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hisRecordId" TEXT,
ADD COLUMN     "patientCondition" TEXT,
ADD COLUMN     "prescriptions" JSONB,
ADD COLUMN     "upss" TEXT,
ADD COLUMN     "vitalSignsAtEntry" JSONB,
ALTER COLUMN "type" SET DEFAULT 'CONSULTA_MEDICINA_GENERAL';

-- CreateIndex
CREATE INDEX "appointments_hisLinked_idx" ON "appointments"("hisLinked");

-- CreateIndex
CREATE INDEX "appointments_type_idx" ON "appointments"("type");
