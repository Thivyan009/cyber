/*
  Warnings:

  - You are about to drop the column `date` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `modules` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `progress` on the `Report` table. All the data in the column will be lost.
  - The `vulnerabilities` column on the `Report` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Report" DROP COLUMN "date",
DROP COLUMN "modules",
DROP COLUMN "progress",
ADD COLUMN     "enhancedReport" JSONB,
DROP COLUMN "vulnerabilities",
ADD COLUMN     "vulnerabilities" JSONB,
ALTER COLUMN "critical" SET DEFAULT 0,
ALTER COLUMN "high" SET DEFAULT 0,
ALTER COLUMN "medium" SET DEFAULT 0,
ALTER COLUMN "low" SET DEFAULT 0;
