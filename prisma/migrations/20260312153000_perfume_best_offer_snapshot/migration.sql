-- Denormalized best-offer snapshot to speed up public catalog reads.
ALTER TABLE "Perfume"
ADD COLUMN "bestPriceAmount" DOUBLE PRECISION,
ADD COLUMN "bestTotalPriceAmount" DOUBLE PRECISION,
ADD COLUMN "bestCurrency" TEXT,
ADD COLUMN "bestStoreName" TEXT,
ADD COLUMN "bestOfferUrl" TEXT,
ADD COLUMN "bestOfferUpdatedAt" TIMESTAMP(3),
ADD COLUMN "hasAvailableOffer" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "Perfume_bestTotalPriceAmount_idx" ON "Perfume"("bestTotalPriceAmount");
CREATE INDEX "Perfume_hasAvailableOffer_bestTotalPriceAmount_idx" ON "Perfume"("hasAvailableOffer", "bestTotalPriceAmount");
