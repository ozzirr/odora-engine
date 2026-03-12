CREATE INDEX "perfume_rating_updated_name_idx"
ON "Perfume" ("ratingInternal" DESC, "updatedAt" DESC, "name" ASC);

CREATE INDEX "perfume_arabic_rating_updated_idx"
ON "Perfume" ("isArabic" ASC, "ratingInternal" DESC, "updatedAt" DESC);

CREATE INDEX "perfume_niche_rating_updated_idx"
ON "Perfume" ("isNiche" ASC, "ratingInternal" DESC, "updatedAt" DESC);

CREATE INDEX "perfume_longevity_rating_updated_idx"
ON "Perfume" ("longevityScore" DESC, "ratingInternal" DESC, "updatedAt" DESC);

CREATE INDEX "perfume_offer_price_rating_name_idx"
ON "Perfume" ("hasAvailableOffer" ASC, "bestTotalPriceAmount" ASC, "ratingInternal" DESC, "name" ASC);

CREATE INDEX "perfume_gender_rating_name_idx"
ON "Perfume" ("gender" ASC, "ratingInternal" DESC, "name" ASC);

CREATE INDEX "perfume_price_range_rating_name_idx"
ON "Perfume" ("priceRange" ASC, "ratingInternal" DESC, "name" ASC);

CREATE INDEX "perfume_family_rating_name_idx"
ON "Perfume" ("fragranceFamily" ASC, "ratingInternal" DESC, "name" ASC);
