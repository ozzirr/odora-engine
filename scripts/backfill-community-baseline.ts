import { prisma } from "@/lib/prisma";

const SYSTEM_USER_ID = "odora-community-baseline";
const SYSTEM_SOURCE = "catalog-baseline";

async function main() {
  const systemUser = await prisma.user.upsert({
    where: { id: SYSTEM_USER_ID },
    create: {
      id: SYSTEM_USER_ID,
      email: "community-baseline@odora.local",
      name: "Odora",
    },
    update: {
      name: "Odora",
    },
  });

  const perfumes = await prisma.perfume.findMany({
    select: {
      id: true,
      name: true,
      longevityScore: true,
      sillageScore: true,
      versatilityScore: true,
      bestTotalPriceAmount: true,
      bestCurrency: true,
      bestStoreName: true,
      hasAvailableOffer: true,
    },
  });

  let scoreBackfilled = 0;
  let priceBackfilled = 0;
  let skippedScores = 0;
  let skippedPrices = 0;

  for (const perfume of perfumes) {
    if (
      perfume.longevityScore != null &&
      perfume.sillageScore != null &&
      perfume.versatilityScore != null
    ) {
      await prisma.perfumeReview.upsert({
        where: {
          userId_perfumeId: {
            userId: systemUser.id,
            perfumeId: perfume.id,
          },
        },
        create: {
          userId: systemUser.id,
          perfumeId: perfume.id,
          source: SYSTEM_SOURCE,
          longevityScore: perfume.longevityScore,
          sillageScore: perfume.sillageScore,
          versatilityScore: perfume.versatilityScore,
          text: null,
        },
        update: {
          source: SYSTEM_SOURCE,
          longevityScore: perfume.longevityScore,
          sillageScore: perfume.sillageScore,
          versatilityScore: perfume.versatilityScore,
          text: null,
        },
      });
      scoreBackfilled += 1;
    } else {
      skippedScores += 1;
    }

    if (
      perfume.hasAvailableOffer &&
      perfume.bestTotalPriceAmount != null &&
      Number.isFinite(perfume.bestTotalPriceAmount)
    ) {
      const existingPrice = await prisma.perfumePurchasePrice.findFirst({
        where: {
          userId: systemUser.id,
          perfumeId: perfume.id,
          source: SYSTEM_SOURCE,
        },
        select: { id: true },
      });

      if (existingPrice) {
        await prisma.perfumePurchasePrice.update({
          where: { id: existingPrice.id },
          data: {
            priceAmount: perfume.bestTotalPriceAmount,
            currency: perfume.bestCurrency ?? "EUR",
            storeName: perfume.bestStoreName,
          },
        });
      } else {
        await prisma.perfumePurchasePrice.create({
          data: {
            userId: systemUser.id,
            perfumeId: perfume.id,
            source: SYSTEM_SOURCE,
            priceAmount: perfume.bestTotalPriceAmount,
            currency: perfume.bestCurrency ?? "EUR",
            storeName: perfume.bestStoreName,
          },
        });
      }
      priceBackfilled += 1;
    } else {
      skippedPrices += 1;
    }
  }

  console.log(
    JSON.stringify(
      {
        perfumes: perfumes.length,
        scoreBackfilled,
        priceBackfilled,
        skippedScores,
        skippedPrices,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
