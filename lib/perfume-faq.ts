import type { FaqItem } from "@/components/seo/FaqSection";

type Translator = (key: string, values?: Record<string, string | number>) => string;

type PerfumeFaqInput = {
  name: string;
  brand?: string | null;
  family?: string | null;
  longevity?: number | null;
  gender?: "MEN" | "WOMEN" | "UNISEX" | null;
  bestPriceLabel?: string | null;
};

export function buildPerfumeFaqItems(t: Translator, perfume: PerfumeFaqInput): FaqItem[] {
  const items: FaqItem[] = [];
  const { name, brand, family, longevity, gender, bestPriceLabel } = perfume;

  const priceQ = brand
    ? t("items.price.q", { name, brand })
    : t("items.price.qNoBrand", { name });
  items.push({
    question: priceQ,
    answer: bestPriceLabel
      ? t("items.price.a", { name, price: bestPriceLabel })
      : t("items.price.aNoPrice", { name }),
  });

  if (typeof longevity === "number" && longevity > 0) {
    items.push({
      question: t("items.longevity.q", { name }),
      answer: t("items.longevity.a", { name, longevity }),
    });
  }

  if (family) {
    items.push({
      question: t("items.season.q", { name }),
      answer: t("items.season.a", { name, family }),
    });
  }

  if (brand) {
    const genderAnswerKey =
      gender === "MEN"
        ? "items.gender.aMen"
        : gender === "WOMEN"
          ? "items.gender.aWomen"
          : gender === "UNISEX"
            ? "items.gender.aUnisex"
            : null;
    if (genderAnswerKey) {
      items.push({
        question: t("items.gender.q", { name }),
        answer: t(genderAnswerKey, { name, brand }),
      });
    }
  } else {
    items.push({
      question: t("items.gender.q", { name }),
      answer: t("items.gender.aGeneric", { name }),
    });
  }

  items.push({
    question: t("items.where.q", { name }),
    answer: t("items.where.a", { name }),
  });

  return items;
}
