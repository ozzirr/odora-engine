import Link from "next/link";

import { SectionTitle } from "@/components/ui/SectionTitle";
import { discoveryCollections } from "@/lib/sample-data";

export function DiscoveryCollections() {
  return (
    <section className="mt-24 space-y-6">
      <SectionTitle
        eyebrow="Collections"
        title="Discovery collections"
        subtitle="Simple routes into the live catalog while richer editorial content is still being built."
      />

      <div className="grid gap-4 md:grid-cols-3">
        {discoveryCollections.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="premium-card rounded-[1.4rem] border border-[#e0d5c6] bg-white/70 p-5 shadow-[0_18px_40px_-34px_rgba(50,35,20,0.28)] transition-all duration-300 hover:-translate-y-0.5"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a7763]">
              Catalog route
            </p>
            <h3 className="mt-2 font-display text-[1.7rem] text-[#1f1914]">{card.title}</h3>
            <p className="mt-2 text-sm leading-6 text-[#625243]">{card.description}</p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-[#816f5c]">
              Browse collection
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
