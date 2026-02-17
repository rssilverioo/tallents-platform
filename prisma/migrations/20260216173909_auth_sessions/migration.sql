/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `Analyst` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Analyst" DROP COLUMN "updatedAt";

-- CreateTable
CREATE TABLE "AnalystSession" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "analystId" TEXT NOT NULL,

    CONSTRAINT "AnalystSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AnalystSession_token_key" ON "AnalystSession"("token");

-- CreateIndex
CREATE INDEX "AnalystSession_analystId_idx" ON "AnalystSession"("analystId");

-- CreateIndex
CREATE INDEX "AnalystSession_expiresAt_idx" ON "AnalystSession"("expiresAt");

-- AddForeignKey
ALTER TABLE "AnalystSession" ADD CONSTRAINT "AnalystSession_analystId_fkey" FOREIGN KEY ("analystId") REFERENCES "Analyst"("id") ON DELETE CASCADE ON UPDATE CASCADE;
