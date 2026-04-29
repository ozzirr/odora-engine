CREATE TABLE "PerfumePriceAlert" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "perfumeId" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerfumePriceAlert_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PerfumePriceAlert_userId_perfumeId_key" ON "PerfumePriceAlert"("userId", "perfumeId");
CREATE INDEX "PerfumePriceAlert_perfumeId_idx" ON "PerfumePriceAlert"("perfumeId");
CREATE INDEX "PerfumePriceAlert_userId_idx" ON "PerfumePriceAlert"("userId");
CREATE INDEX "PerfumePriceAlert_active_idx" ON "PerfumePriceAlert"("active");

ALTER TABLE "PerfumePriceAlert" ADD CONSTRAINT "PerfumePriceAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PerfumePriceAlert" ADD CONSTRAINT "PerfumePriceAlert_perfumeId_fkey" FOREIGN KEY ("perfumeId") REFERENCES "Perfume"("id") ON DELETE CASCADE ON UPDATE CASCADE;
