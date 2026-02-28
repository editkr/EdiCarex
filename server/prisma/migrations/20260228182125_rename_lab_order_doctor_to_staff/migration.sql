/*
  Warnings:

  - You are about to drop the column `doctorId` on the `lab_orders` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "lab_orders" DROP CONSTRAINT "lab_orders_doctorId_fkey";

-- AlterTable
ALTER TABLE "lab_orders" DROP COLUMN "doctorId",
ADD COLUMN     "staffId" TEXT;

-- AddForeignKey
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "health_staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
