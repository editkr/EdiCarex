-- AlterTable
ALTER TABLE "backup_logs" ADD COLUMN     "checksum" TEXT,
ADD COLUMN     "details" JSONB;

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'PEN';

-- AlterTable
ALTER TABLE "organization_configs" ADD COLUMN     "maintenanceMode" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "triages" (
    "id" TEXT NOT NULL,
    "patientId" TEXT,
    "patientName" TEXT NOT NULL,
    "patientAge" INTEGER,
    "patientDni" TEXT,
    "heartRate" INTEGER,
    "respiratoryRate" INTEGER,
    "temperature" DOUBLE PRECISION,
    "oxygenSaturation" DOUBLE PRECISION,
    "bloodPressure" TEXT,
    "weight" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "glucometry" DOUBLE PRECISION,
    "priority" TEXT NOT NULL DEFAULT 'VERDE',
    "chiefComplaint" TEXT NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'WAITING',
    "triageBy" TEXT,
    "triageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attendedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "triages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vaccinations" (
    "id" TEXT NOT NULL,
    "patientId" TEXT,
    "patientName" TEXT NOT NULL,
    "patientAge" INTEGER,
    "patientDni" TEXT,
    "vaccineName" TEXT NOT NULL,
    "doseNumber" TEXT NOT NULL,
    "lotNumber" TEXT,
    "laboratory" TEXT,
    "expirationDate" TIMESTAMP(3),
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appliedBy" TEXT NOT NULL,
    "site" TEXT,
    "route" TEXT NOT NULL DEFAULT 'IM',
    "category" TEXT NOT NULL,
    "nextDoseDate" TIMESTAMP(3),
    "nextVaccine" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'APPLIED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vaccinations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "minsa_programs" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "monthlyGoal" INTEGER NOT NULL DEFAULT 100,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "coordinator" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "minsa_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "minsa_program_records" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "patientId" TEXT,
    "patientName" TEXT NOT NULL,
    "patientDni" TEXT,
    "patientAge" INTEGER,
    "visitDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "visitType" TEXT NOT NULL,
    "observations" TEXT,
    "nextVisitDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "attendedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "minsa_program_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "triages_status_idx" ON "triages"("status");

-- CreateIndex
CREATE INDEX "triages_priority_idx" ON "triages"("priority");

-- CreateIndex
CREATE INDEX "triages_triageAt_idx" ON "triages"("triageAt");

-- CreateIndex
CREATE INDEX "vaccinations_patientId_idx" ON "vaccinations"("patientId");

-- CreateIndex
CREATE INDEX "vaccinations_appliedAt_idx" ON "vaccinations"("appliedAt");

-- CreateIndex
CREATE INDEX "vaccinations_category_idx" ON "vaccinations"("category");

-- CreateIndex
CREATE INDEX "vaccinations_vaccineName_idx" ON "vaccinations"("vaccineName");

-- CreateIndex
CREATE UNIQUE INDEX "minsa_programs_code_key" ON "minsa_programs"("code");

-- CreateIndex
CREATE INDEX "minsa_program_records_programId_idx" ON "minsa_program_records"("programId");

-- CreateIndex
CREATE INDEX "minsa_program_records_patientId_idx" ON "minsa_program_records"("patientId");

-- CreateIndex
CREATE INDEX "minsa_program_records_visitDate_idx" ON "minsa_program_records"("visitDate");

-- AddForeignKey
ALTER TABLE "appointment_check_ins" ADD CONSTRAINT "appointment_check_ins_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "triages" ADD CONSTRAINT "triages_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vaccinations" ADD CONSTRAINT "vaccinations_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "minsa_program_records" ADD CONSTRAINT "minsa_program_records_programId_fkey" FOREIGN KEY ("programId") REFERENCES "minsa_programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "minsa_program_records" ADD CONSTRAINT "minsa_program_records_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
