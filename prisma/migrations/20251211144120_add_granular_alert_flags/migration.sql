/*
  Warnings:

  - You are about to drop the column `isSafezoneAlertSent` on the `dependent_profiles` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "dependent_profiles" DROP COLUMN "isSafezoneAlertSent",
ADD COLUMN     "isAlertNearZone2Sent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isAlertZone1Sent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isAlertZone2Sent" BOOLEAN NOT NULL DEFAULT false;
