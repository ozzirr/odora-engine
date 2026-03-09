import Link from "next/link";

import { Container } from "@/components/layout/Container";
import { buttonStyles } from "@/components/ui/Button";
import { SectionTitle } from "@/components/ui/SectionTitle";

export default function FinderPage() {
  return (
    <Container className="pt-14">
      <div className="rounded-3xl border border-[#dfd1bf] bg-white p-8 sm:p-12">
        <SectionTitle
          eyebrow="Coming soon"
          title="Fragrance Finder"
          subtitle="The advisor flow is in progress. Soon you will discover perfumes based on taste, favorite notes, mood, and budget."
        />

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-[#f7f1e8] p-4 text-sm text-[#5f4f40]">
            Discover by notes and accords
          </div>
          <div className="rounded-2xl bg-[#f7f1e8] p-4 text-sm text-[#5f4f40]">
            Match mood, season, and occasion
          </div>
          <div className="rounded-2xl bg-[#f7f1e8] p-4 text-sm text-[#5f4f40]">
            Compare options by budget range
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/perfumes" className={buttonStyles()}>
            Browse perfumes now
          </Link>
          <Link href="/top" className={buttonStyles({ variant: "secondary" })}>
            Explore top lists
          </Link>
        </div>
      </div>
    </Container>
  );
}
