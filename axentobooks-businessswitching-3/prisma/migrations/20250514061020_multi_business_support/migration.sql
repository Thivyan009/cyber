-- DropIndex
DROP INDEX "businesses_userId_key";

-- AlterTable
ALTER TABLE "businesses" ADD COLUMN     "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;

-- Drop the unique constraint on the userId column in the businesses table
ALTER TABLE "businesses" DROP CONSTRAINT IF EXISTS "businesses_userId_key";

-- Add onboardingCompleted column to businesses table if it doesn't exist
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;
