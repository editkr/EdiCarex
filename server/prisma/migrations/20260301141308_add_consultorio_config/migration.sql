-- CreateTable
CREATE TABLE "consultorio_configs" (
    "id" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "upss" TEXT NOT NULL,
    "maxDailySlots" INTEGER NOT NULL DEFAULT 18,
    "slotDurationMinutes" INTEGER NOT NULL DEFAULT 20,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "color" TEXT,
    "ipressCode" TEXT NOT NULL DEFAULT '00003308',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consultorio_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "consultorio_configs_serviceName_key" ON "consultorio_configs"("serviceName");
