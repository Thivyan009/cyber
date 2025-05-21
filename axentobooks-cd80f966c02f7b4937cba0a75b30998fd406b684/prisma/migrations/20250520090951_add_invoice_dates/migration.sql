-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "creationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "paidDate" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Notification_timestamp_idx" ON "Notification"("timestamp");
