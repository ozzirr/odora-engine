import { getTranslations } from "next-intl/server";

import { BuyIcon, CompareIcon, DiscoverIcon } from "@/components/home/HomeIllustrations";
import { Container } from "@/components/layout/Container";
import { PerfumeGrid } from "@/components/perfumes/PerfumeGrid";
import { buttonStyles } from "@/components/ui/Button";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { getHomepageData, toPerfumeCardItem, type HomePerfumeRecord } from "@/lib/homepage";
import { Link } from "@/lib/navigation";

function pickAlternativePerfumes(perfumes: HomePerfumeRecord[], limit = 4) {
  const seenSlugs = new Set<string>();

  return perfumes.filter((perfume) => {
    if (seenSlugs.has(perfume.slug)) {
      return false;
    }

    seenSlugs.add(perfume.slug);
    return true;
  }).slice(0, limit);
}

export default async function LocaleNotFoundPage() {
  const t = await getTranslations("notFound");
  const homepageData = await getHomepageData();
  const alternatives = pickAlternativePerfumes([
    ...homepageData.trending,
    ...homepageData.featured,
    ...homepageData.heroSpotlights,
  ]).map(toPerfumeCardItem);

  const helperCards = [
    {
      key: "finder",
      title: t("helperCards.finder.title"),
      description: t("helperCards.finder.description"),
      Icon: DiscoverIcon,
    },
    {
      key: "catalog",
      title: t("helperCards.catalog.title"),
      description: t("helperCards.catalog.description"),
      Icon: BuyIcon,
    },
    {
      key: "compare",
      title: t("helperCards.compare.title"),
      description: t("helperCards.compare.description"),
      Icon: CompareIcon,
    },
  ];

  return (
    <Container className="pb-24 pt-14 sm:pt-18">
      <section className="paper-texture relative overflow-hidden rounded-[2.2rem] border border-[#e4d8c8] bg-[#f8f3ea] px-6 py-9 shadow-[0_30px_90px_-55px_rgba(50,35,20,0.52)] sm:px-10 sm:py-12 lg:px-14 lg:py-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.74),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(231,214,193,0.52),transparent_26%),linear-gradient(120deg,rgba(255,255,255,0.18),transparent_42%)]" />
        <div className="pointer-events-none absolute inset-4 rounded-[1.85rem] border border-white/45" />
        <div className="pointer-events-none absolute -left-10 top-14 h-40 w-40 rounded-full bg-white/35 blur-3xl sm:h-52 sm:w-52" />
        <div className="pointer-events-none absolute -right-12 bottom-8 h-56 w-56 rounded-full bg-[#eadbc6]/60 blur-3xl sm:h-72 sm:w-72" />
        <p className="pointer-events-none absolute right-6 top-5 font-display text-[4.5rem] leading-none text-[#dacbb8]/60 sm:right-10 sm:top-8 sm:text-[6.5rem]">
          404
        </p>

        <div className="relative mx-auto max-w-4xl text-center">
          <p className="inline-flex rounded-full border border-white/60 bg-white/55 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a7763] shadow-[0_14px_26px_-24px_rgba(52,37,24,0.44)] backdrop-blur-[2px]">
            {t("eyebrow")}
          </p>
          <h1 className="mx-auto mt-6 max-w-3xl font-display text-5xl leading-[0.98] text-[#1c1712] sm:text-6xl lg:text-[5.1rem]">
            {t("title")}
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-base leading-7 text-[#5f5041] sm:text-xl sm:leading-8">
            {t("description")}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/finder" className={buttonStyles({ size: "lg", className: "min-w-[11rem]" })}>
              {t("primaryCta")}
            </Link>
            <Link
              href="/perfumes"
              className={buttonStyles({
                variant: "secondary",
                size: "lg",
                className: "min-w-[11rem]",
              })}
            >
              {t("secondaryCta")}
            </Link>
          </div>
        </div>

        <div className="relative mt-10 grid gap-4 lg:grid-cols-3">
          {helperCards.map(({ key, title, description, Icon }) => (
            <article
              key={key}
              className="premium-card rounded-[1.6rem] border border-white/70 bg-white/55 p-5 text-left shadow-[0_20px_40px_-34px_rgba(52,37,24,0.45)] backdrop-blur-[2px]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#e5d9c9] bg-[#f5ede2] text-[#5a4938] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-4 font-display text-[1.8rem] leading-tight text-[#1f1914]">
                {title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#5e4f40]">{description}</p>
            </article>
          ))}
        </div>
      </section>

      {alternatives.length > 0 ? (
        <section className="mt-24 space-y-8">
          <SectionTitle
            eyebrow={t("alternatives.eyebrow")}
            title={t("alternatives.title")}
            subtitle={t("alternatives.subtitle")}
          />
          <PerfumeGrid perfumes={alternatives} />
        </section>
      ) : null}
    </Container>
  );
}
