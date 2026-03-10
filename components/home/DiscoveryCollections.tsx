import type { ComponentProps } from "react";
import { HomepageCollectionType } from "@prisma/client";
import { useTranslations } from "next-intl";

import { SectionTitle } from "@/components/ui/SectionTitle";
import type { HomeCollectionCard } from "@/lib/homepage";
import { Link } from "@/lib/navigation";

type DiscoveryCollectionsProps = {
  collections: HomeCollectionCard[];
};

type LinkHref = ComponentProps<typeof Link>["href"];

export function DiscoveryCollections({ collections }: DiscoveryCollectionsProps) {
  const t = useTranslations("home.discoveryCollections");

  if (collections.length === 0) {
    return null;
  }

  return (
    <section className="mt-24 space-y-6">
      <SectionTitle
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
      />

      <div className="grid gap-4 md:grid-cols-3">
        {collections.map((card) => (
          <Link
            key={card.slug}
            href={card.href as unknown as LinkHref}
            className="premium-card rounded-[1.4rem] border border-[#e0d5c6] bg-white/70 p-5 shadow-[0_18px_40px_-34px_rgba(50,35,20,0.28)] transition-all duration-300 hover:-translate-y-0.5"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a7763]">
              {card.type === HomepageCollectionType.FINDER_PRESET
                ? t("type.finderPreset")
                : t("type.catalogRoute")}
            </p>
            <h3 className="mt-2 font-display text-[1.7rem] text-[#1f1914]">{card.title}</h3>
            {card.subtitle ? (
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#8a7763]">
                {card.subtitle}
              </p>
            ) : null}
            {card.description ? (
              <p className="mt-2 text-sm leading-6 text-[#625243]">{card.description}</p>
            ) : null}
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-[#816f5c]">
              {t("cta")}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
