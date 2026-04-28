ALTER TABLE "PerfumeReview" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'user';

ALTER TABLE "PerfumePurchasePrice" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'user';

CREATE INDEX "PerfumeReview_source_idx" ON "PerfumeReview"("source");

CREATE INDEX "PerfumePurchasePrice_source_idx" ON "PerfumePurchasePrice"("source");
