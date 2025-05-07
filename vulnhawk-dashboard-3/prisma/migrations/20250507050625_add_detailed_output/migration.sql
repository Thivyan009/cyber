/*
  Warnings:

  - Added the required column `findingType` to the `Vulnerability` table without a default value. This is not possible if the table is not empty.
  - Added the required column `module` to the `Vulnerability` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "modules" TEXT[],
ADD COLUMN     "rawOutput" JSONB;

-- AlterTable
ALTER TABLE "Vulnerability" ADD COLUMN     "details" JSONB,
ADD COLUMN     "findingType" TEXT NOT NULL,
ADD COLUMN     "module" TEXT NOT NULL;
