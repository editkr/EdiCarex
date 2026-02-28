-- AlterTable
ALTER TABLE "establishment_config" ALTER COLUMN "email" SET DEFAULT 'cs.jorgechavez@diresapuno.gob.pe',
ALTER COLUMN "operatingHours" SET DEFAULT '08:00-18:00',
ALTER COLUMN "category" SET DEFAULT 'I-4',
ALTER COLUMN "resolution" SET DEFAULT 'R.D.R. Nº 0112-2019/DIRESE PUNO-DESP-DSS';

-- AlterTable
ALTER TABLE "observation_stretchers" ADD COLUMN     "alertSentAt" TIMESTAMP(3),
ADD COLUMN     "attendedBy" TEXT,
ADD COLUMN     "diagnosis" TEXT,
ADD COLUMN     "dischargeReason" TEXT,
ADD COLUMN     "maxHours" INTEGER NOT NULL DEFAULT 12,
ADD COLUMN     "referralDestination" TEXT,
ADD COLUMN     "referredAt" TIMESTAMP(3),
ADD COLUMN     "vitalSigns" JSONB;

-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "sisCode" TEXT,
ADD COLUMN     "sisStatus" TEXT NOT NULL DEFAULT 'NOT_AFFILIATED',
ADD COLUMN     "sisValidatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "vaccinations" ADD COLUMN     "adverseEventNotes" TEXT,
ADD COLUMN     "coldChainTemp" DOUBLE PRECISION,
ADD COLUMN     "coldChainVerifiedBy" TEXT,
ADD COLUMN     "isAdverseEvent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "vialNumber" TEXT;

-- CreateTable
CREATE TABLE "referral_records" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "originIpress" TEXT NOT NULL DEFAULT '00003308',
    "destinationIpress" TEXT NOT NULL,
    "diagnosis" TEXT NOT NULL,
    "urgencyLevel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "referredBy" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "counterReferralNote" TEXT,
    "vitalSigns" JSONB,
    "previousTreatment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referral_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "his_records" (
    "id" TEXT NOT NULL,
    "ipressCode" TEXT NOT NULL DEFAULT '00003308',
    "attentionDate" TIMESTAMP(3) NOT NULL,
    "patientId" TEXT,
    "age" INTEGER NOT NULL,
    "gender" TEXT NOT NULL,
    "ubigeo" TEXT NOT NULL,
    "diagnosis" TEXT NOT NULL,
    "conditionType" TEXT NOT NULL,
    "fundingType" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "encounterId" TEXT,
    "exportFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "his_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "epidemiology_reports" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "disease" TEXT NOT NULL,
    "caseType" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "symptomsDate" TIMESTAMP(3) NOT NULL,
    "notifier" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "epidemiology_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sis_validation_logs" (
    "id" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "sisCode" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "validatedBy" TEXT NOT NULL,
    "rawResponse" JSONB,
    "result" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "patientId" TEXT,

    CONSTRAINT "sis_validation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "referral_records_code_key" ON "referral_records"("code");

-- CreateIndex
CREATE INDEX "referral_records_patientId_idx" ON "referral_records"("patientId");

-- CreateIndex
CREATE INDEX "referral_records_code_idx" ON "referral_records"("code");

-- CreateIndex
CREATE INDEX "his_records_patientId_idx" ON "his_records"("patientId");

-- CreateIndex
CREATE INDEX "his_records_staffId_idx" ON "his_records"("staffId");

-- CreateIndex
CREATE INDEX "his_records_attentionDate_idx" ON "his_records"("attentionDate");

-- CreateIndex
CREATE UNIQUE INDEX "epidemiology_reports_code_key" ON "epidemiology_reports"("code");

-- CreateIndex
CREATE INDEX "epidemiology_reports_patientId_idx" ON "epidemiology_reports"("patientId");

-- CreateIndex
CREATE INDEX "epidemiology_reports_code_idx" ON "epidemiology_reports"("code");

-- CreateIndex
CREATE INDEX "sis_validation_logs_documentNumber_idx" ON "sis_validation_logs"("documentNumber");

-- CreateIndex
CREATE INDEX "sis_validation_logs_patientId_idx" ON "sis_validation_logs"("patientId");

-- AddForeignKey
ALTER TABLE "referral_records" ADD CONSTRAINT "referral_records_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "his_records" ADD CONSTRAINT "his_records_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "his_records" ADD CONSTRAINT "his_records_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "health_staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "his_records" ADD CONSTRAINT "his_records_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "encounters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "epidemiology_reports" ADD CONSTRAINT "epidemiology_reports_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sis_validation_logs" ADD CONSTRAINT "sis_validation_logs_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
