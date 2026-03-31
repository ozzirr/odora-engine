CREATE TABLE "AffiliateClick" (
    "id" SERIAL NOT NULL,
    "perfumeSlug" TEXT,
    "destination" TEXT NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "locale" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AffiliateClick_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AffiliateClick_perfumeSlug_idx" ON "AffiliateClick"("perfumeSlug");
CREATE INDEX "AffiliateClick_destination_idx" ON "AffiliateClick"("destination");
CREATE INDEX "AffiliateClick_createdAt_idx" ON "AffiliateClick"("createdAt");
