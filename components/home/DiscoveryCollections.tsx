import Link from "next/link";

import { SectionTitle } from "@/components/ui/SectionTitle";
import type { HomeCollectionCard } from "@/lib/homepage";

type DiscoveryCollectionsProps = {
  collections: HomeCollectionCard[];
};

export function DiscoveryCollections({ collections }: DiscoveryCollectionsProps) {
  if (collections.length === 0) {
    return null;
  }

  return (
    <section className="mt-24 space-y-6">
      <SectionTitle
        eyebrow="Collections"
        title="Discovery collections"
        subtitle="Browse the catalog through thoughtful edits built around style, mood, and what you want to find next."
      />

      <div className="grid gap-4 md:grid-cols-3">
        {collections.map((card) => (
          <Link
            key={card.slug}
            href={card.href}
            className="premium-card rounded-[1.4rem] border border-[#e0d5c6] bg-white/70 p-5 shadow-[0_18px_40px_-34px_rgba(50,35,20,0.28)] transition-all duration-300 hover:-translate-y-0.5"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a7763]">
              {card.typeLabel}
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
              Explore collection
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
