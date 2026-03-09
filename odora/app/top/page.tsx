import Link from "next/link";

import { Container } from "@/components/layout/Container";
import { buttonStyles } from "@/components/ui/Button";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { topCollections } from "@/lib/sample-data";

export default function TopPage() {
  return (
    <Container className="pt-14">
      <SectionTitle
        eyebrow="Editorial"
        title="Top fragrance collections"
        subtitle="Static mock content for now. Future iterations will support dynamic rankings and richer editorial guides."
      />

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {topCollections.map((collection) => (
          <article
            key={collection.title}
            className="rounded-2xl border border-[#dfd1bf] bg-white p-6 shadow-[0_20px_45px_-38px_rgba(48,34,20,0.38)]"
          >
            <h2 className="font-display text-3xl text-[#1f1914]">{collection.title}</h2>
            <p className="mt-2 text-sm text-[#5f4f40]">{collection.description}</p>
            <Link href={collection.href} className={buttonStyles({ className: "mt-5" })}>
              Explore collection
            </Link>
          </article>
        ))}
      </div>
    </Container>
  );
}
