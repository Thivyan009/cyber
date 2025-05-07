-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "vulnerabilities" INTEGER NOT NULL,
    "critical" INTEGER NOT NULL,
    "high" INTEGER NOT NULL,
    "medium" INTEGER NOT NULL,
    "low" INTEGER NOT NULL,
    "progress" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vulnerability" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vulnerability_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Vulnerability" ADD CONSTRAINT "Vulnerability_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
