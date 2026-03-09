import Link from "next/link";

import { Container } from "@/components/layout/Container";
import { buttonStyles } from "@/components/ui/Button";

export function Hero() {
  return (
    <section className="pt-14 sm:pt-18">
      <Container>
        <div className="rounded-3xl border border-[#e4d8c8] bg-[#f8f3ea] p-8 shadow-[0_20px_60px_-40px_rgba(50,35,20,0.45)] sm:p-12">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7763]">
            Fragrance Discovery
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl leading-tight text-[#1c1712] sm:text-6xl">
            Discover your next fragrance.
          </h1>
          <p className="mt-5 max-w-2xl text-base text-[#5f5041] sm:text-lg">
            Browse perfumes, explore notes and styles, and compare offers from trusted
            stores in one elegant experience.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/perfumes" className={buttonStyles({ size: "lg" })}>
              Explore perfumes
            </Link>
            <Link href="/finder" className={buttonStyles({ variant: "secondary", size: "lg" })}>
              Try finder preview
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
