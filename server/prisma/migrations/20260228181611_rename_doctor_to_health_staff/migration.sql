/*
  Warnings:

  - You are about to drop the column `doctorId` on the `appointments` table. All the data in the column will be lost.
  - You are about to drop the column `doctorId` on the `emergency_cases` table. All the data in the column will be lost.
  - You are about to drop the column `doctorName` on the `emergency_cases` table. All the data in the column will be lost.
  - You are about to drop the column `doctorId` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `doctorId` on the `medical_records` table. All the data in the column will be lost.
  - You are about to drop the column `doctorId` on the `pharmacy_orders` table. All the data in the column will be lost.
  - You are about to drop the `doctor_documents` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `doctor_schedules` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `doctors` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[encounterId]` on the table `triages` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `staffId` to the `appointments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `staffId` to the `medical_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `staffId` to the `pharmacy_orders` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_doctorId_fkey";

-- DropForeignKey
ALTER TABLE "doctor_documents" DROP CONSTRAINT "doctor_documents_doctorId_fkey";

-- DropForeignKey
ALTER TABLE "doctor_schedules" DROP CONSTRAINT "doctor_schedules_doctorId_fkey";

-- DropForeignKey
ALTER TABLE "doctors" DROP CONSTRAINT "doctors_specialtyId_fkey";

-- DropForeignKey
ALTER TABLE "doctors" DROP CONSTRAINT "doctors_userId_fkey";

-- DropForeignKey
ALTER TABLE "emergency_cases" DROP CONSTRAINT "emergency_cases_doctorId_fkey";

-- DropForeignKey
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_doctorId_fkey";

-- DropForeignKey
ALTER TABLE "lab_orders" DROP CONSTRAINT "lab_orders_doctorId_fkey";

-- DropForeignKey
ALTER TABLE "medical_records" DROP CONSTRAINT "medical_records_doctorId_fkey";

-- DropForeignKey
ALTER TABLE "patient_medications" DROP CONSTRAINT "patient_medications_prescribedById_fkey";

-- DropForeignKey
ALTER TABLE "pharmacy_orders" DROP CONSTRAINT "pharmacy_orders_doctorId_fkey";

-- DropIndex
DROP INDEX "appointments_doctorId_idx";

-- DropIndex
DROP INDEX "medical_records_doctorId_idx";

-- DropIndex
DROP INDEX "pharmacy_orders_doctorId_idx";

-- AlterTable
ALTER TABLE "appointments" DROP COLUMN "doctorId",
ADD COLUMN     "staffId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "emergency_cases" DROP COLUMN "doctorId",
DROP COLUMN "doctorName",
ADD COLUMN     "staffId" TEXT,
ADD COLUMN     "staffName" TEXT;

-- AlterTable
ALTER TABLE "invoices" DROP COLUMN "doctorId",
ADD COLUMN     "staffId" TEXT;

-- AlterTable
ALTER TABLE "lab_orders" ADD COLUMN     "encounterId" TEXT;

-- AlterTable
ALTER TABLE "lab_results" ADD COLUMN     "encounterId" TEXT;

-- AlterTable
ALTER TABLE "medical_records" DROP COLUMN "doctorId",
ADD COLUMN     "encounterId" TEXT,
ADD COLUMN     "staffId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "insuranceType" TEXT DEFAULT 'MINSA',
ALTER COLUMN "insuranceProvider" SET DEFAULT 'SIS';

-- AlterTable
ALTER TABLE "pharmacy_orders" DROP COLUMN "doctorId",
ADD COLUMN     "staffId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "triages" ADD COLUMN     "encounterId" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "lockoutUntil" TIMESTAMP(3),
ADD COLUMN     "passwordHash" TEXT,
ADD COLUMN     "tokenVersion" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "doctor_documents";

-- DropTable
DROP TABLE "doctor_schedules";

-- DropTable
DROP TABLE "doctors";

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_staff" (
    "id" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "specialization" TEXT,
    "yearsExperience" INTEGER,
    "consultationFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "bio" TEXT,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "specialtyId" TEXT,

    CONSTRAINT "health_staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_schedules" (
    "id" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "staffId" TEXT NOT NULL,

    CONSTRAINT "staff_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_documents" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "size" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "staffId" TEXT NOT NULL,

    CONSTRAINT "staff_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "establishment_config" (
    "id" TEXT NOT NULL,
    "tradingName" TEXT NOT NULL DEFAULT 'Centro de Salud Jorge Chávez',
    "ipressCode" TEXT NOT NULL DEFAULT '00003308',
    "ruc" TEXT NOT NULL DEFAULT '20222371105',
    "address" TEXT NOT NULL DEFAULT 'Jr. Ancash S/N, Juliaca, San Román, Puno',
    "ubigeo" TEXT NOT NULL DEFAULT '211101',
    "latitude" DOUBLE PRECISION NOT NULL DEFAULT -15.48032349,
    "longitude" DOUBLE PRECISION NOT NULL DEFAULT -70.13931455,
    "altitude" INTEGER NOT NULL DEFAULT 3882,
    "phone" TEXT NOT NULL DEFAULT '951515888',
    "email" TEXT NOT NULL DEFAULT 'esjorgechavez@gmail.com',
    "operatingHours" TEXT NOT NULL DEFAULT '07:00 a 19:00',
    "dependency" TEXT NOT NULL DEFAULT 'DIRESA Puno',
    "red" TEXT NOT NULL DEFAULT 'San Román',
    "microred" TEXT NOT NULL DEFAULT 'Santa Adriana',
    "category" TEXT NOT NULL DEFAULT 'I-3',
    "isInternment" BOOLEAN NOT NULL DEFAULT false,
    "activityStart" TIMESTAMP(3) NOT NULL DEFAULT '1990-11-08 00:00:00 +00:00',
    "resolution" TEXT NOT NULL DEFAULT 'R.D.R. 0964-09/DRS-PUNO-DEA-PER',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "establishment_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "observation_stretchers" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "notes" TEXT,
    "patientId" TEXT,
    "admittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "observation_stretchers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "encounters" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "reason" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "diagnoses" JSONB,
    "vitals" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),
    "patientId" TEXT NOT NULL,
    "staffId" TEXT,
    "appointmentId" TEXT,

    CONSTRAINT "encounters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescriptions" (
    "id" TEXT NOT NULL,
    "medication" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "duration" TEXT,
    "instructions" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "isDispensed" BOOLEAN NOT NULL DEFAULT false,
    "dispensedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "encounterId" TEXT NOT NULL,
    "medicationId" TEXT,

    CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "health_staff_licenseNumber_key" ON "health_staff"("licenseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "health_staff_userId_key" ON "health_staff"("userId");

-- CreateIndex
CREATE INDEX "health_staff_licenseNumber_idx" ON "health_staff"("licenseNumber");

-- CreateIndex
CREATE INDEX "staff_schedules_staffId_idx" ON "staff_schedules"("staffId");

-- CreateIndex
CREATE INDEX "staff_documents_staffId_idx" ON "staff_documents"("staffId");

-- CreateIndex
CREATE UNIQUE INDEX "observation_stretchers_patientId_key" ON "observation_stretchers"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "encounters_appointmentId_key" ON "encounters"("appointmentId");

-- CreateIndex
CREATE INDEX "encounters_patientId_idx" ON "encounters"("patientId");

-- CreateIndex
CREATE INDEX "encounters_staffId_idx" ON "encounters"("staffId");

-- CreateIndex
CREATE INDEX "encounters_type_idx" ON "encounters"("type");

-- CreateIndex
CREATE INDEX "prescriptions_encounterId_idx" ON "prescriptions"("encounterId");

-- CreateIndex
CREATE INDEX "appointments_staffId_idx" ON "appointments"("staffId");

-- CreateIndex
CREATE INDEX "medical_records_staffId_idx" ON "medical_records"("staffId");

-- CreateIndex
CREATE INDEX "pharmacy_orders_staffId_idx" ON "pharmacy_orders"("staffId");

-- CreateIndex
CREATE UNIQUE INDEX "triages_encounterId_key" ON "triages"("encounterId");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_medications" ADD CONSTRAINT "patient_medications_prescribedById_fkey" FOREIGN KEY ("prescribedById") REFERENCES "health_staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_staff" ADD CONSTRAINT "health_staff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_staff" ADD CONSTRAINT "health_staff_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "specialties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_schedules" ADD CONSTRAINT "staff_schedules_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "health_staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_documents" ADD CONSTRAINT "staff_documents_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "health_staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "health_staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observation_stretchers" ADD CONSTRAINT "observation_stretchers_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "health_staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "encounters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pharmacy_orders" ADD CONSTRAINT "pharmacy_orders_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "health_staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "health_staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "encounters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_results" ADD CONSTRAINT "lab_results_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "encounters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "health_staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_cases" ADD CONSTRAINT "emergency_cases_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "health_staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encounters" ADD CONSTRAINT "encounters_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encounters" ADD CONSTRAINT "encounters_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "health_staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encounters" ADD CONSTRAINT "encounters_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "triages" ADD CONSTRAINT "triages_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "encounters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "encounters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "medications"("id") ON DELETE SET NULL ON UPDATE CASCADE;
