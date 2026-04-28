ALTER TABLE "User" ADD COLUMN "countryCode" TEXT;
ALTER TABLE "User" ADD COLUMN "birthDate" TIMESTAMP(3);

CREATE TABLE "PerfumeReview" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "perfumeId" INTEGER NOT NULL,
    "longevityScore" INTEGER NOT NULL,
    "sillageScore" INTEGER NOT NULL,
    "versatilityScore" INTEGER NOT NULL,
    "text" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerfumeReview_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PerfumePurchasePrice" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "perfumeId" INTEGER NOT NULL,
    "priceAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "countryCode" TEXT,
    "storeName" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerfumePurchasePrice_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PerfumeReview_userId_perfumeId_key" ON "PerfumeReview"("userId", "perfumeId");
CREATE INDEX "PerfumeReview_perfumeId_idx" ON "PerfumeReview"("perfumeId");
CREATE INDEX "PerfumeReview_userId_idx" ON "PerfumeReview"("userId");
CREATE INDEX "PerfumeReview_createdAt_idx" ON "PerfumeReview"("createdAt");
CREATE INDEX "PerfumePurchasePrice_perfumeId_idx" ON "PerfumePurchasePrice"("perfumeId");
CREATE INDEX "PerfumePurchasePrice_userId_idx" ON "PerfumePurchasePrice"("userId");
CREATE INDEX "PerfumePurchasePrice_countryCode_idx" ON "PerfumePurchasePrice"("countryCode");
CREATE INDEX "PerfumePurchasePrice_createdAt_idx" ON "PerfumePurchasePrice"("createdAt");

ALTER TABLE "PerfumeReview" ADD CONSTRAINT "PerfumeReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PerfumeReview" ADD CONSTRAINT "PerfumeReview_perfumeId_fkey" FOREIGN KEY ("perfumeId") REFERENCES "Perfume"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PerfumePurchasePrice" ADD CONSTRAINT "PerfumePurchasePrice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PerfumePurchasePrice" ADD CONSTRAINT "PerfumePurchasePrice_perfumeId_fkey" FOREIGN KEY ("perfumeId") REFERENCES "Perfume"("id") ON DELETE CASCADE ON UPDATE CASCADE;
