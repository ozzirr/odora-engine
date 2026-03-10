import Link from "next/link";

import { Container } from "@/components/layout/Container";
import { PerfumeImage } from "@/components/perfumes/PerfumeImage";
import { buttonStyles } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { HomePerfumeSpotlight } from "@/lib/homepage";
import { formatCurrency } from "@/lib/utils";

type HeroProps = {
  preview: HomePerfumeSpotlight | null;
};

const valueProps = [
  "Compare prices across trusted retailers",
  "Explore perfumes by notes, mood, and style",
  "Choose with more confidence",
];

export function Hero({ preview }: HeroProps) {
  return (
    <section className="pt-14 sm:pt-18">
      <Container>
        <div className="paper-texture relative overflow-hidden rounded-[2rem] border border-[#e4d8c8] bg-[#f8f3ea] px-7 py-8 shadow-[0_30px_90px_-55px_rgba(50,35,20,0.52)] sm:px-10 sm:py-12 lg:px-14 lg:py-14">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.75),transparent_34%),radial-gradient(circle_at_78%_18%,rgba(225,209,189,0.55),transparent_28%),linear-gradient(120deg,rgba(255,255,255,0.22),transparent_42%)]" />
          <div
            className={
              preview
                ? "relative grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_360px] lg:items-center"
                : "relative"
            }
          >
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7763]">
                Fragrance Discovery
              </p>
              <h1 className="mt-4 max-w-3xl font-display text-4xl leading-tight text-[#1c1712] sm:text-6xl">
                Find the fragrance that feels like you.
              </h1>
              <p className="mt-5 max-w-2xl text-base text-[#5f5041] sm:text-lg">
                Browse standout perfumes, understand their character, and compare offers in one calm, elegant flow.
              </p>

              <ul className="mt-7 grid gap-3 sm:grid-cols-3">
                {valueProps.map((item) => (
                  <li
                    key={item}
                    className="rounded-[1.25rem] border border-white/65 bg-white/45 px-4 py-3 text-sm text-[#584839] shadow-[0_18px_35px_-30px_rgba(52,37,24,0.48)] backdrop-blur-[2px]"
                  >
                    <span className="flex items-start gap-3">
                      <span className="mt-1 h-2 w-2 rounded-full bg-[#7d6853]" />
                      <span>{item}</span>
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/perfumes" className={buttonStyles({ size: "lg" })}>
                  Browse catalog
                </Link>
                <Link href="/finder" className={buttonStyles({ variant: "secondary", size: "lg" })}>
                  Start Finder
                </Link>
              </div>
            </div>

            {preview ? (
              <div className="premium-card relative overflow-hidden rounded-[1.75rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(247,239,229,0.9))] p-5 shadow-[0_28px_60px_-42px_rgba(45,31,19,0.55)]">
                <div className="absolute inset-x-6 top-0 h-24 rounded-b-[2rem] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.85),transparent_72%)]" />
                <div className="relative">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7763]">
                        Spotlight
                      </p>
                      <p className="mt-1 text-sm text-[#5e4f40]">{preview.brandName}</p>
                    </div>
                    <Badge className="bg-[#1f1914] text-[#f8f4ed]">{preview.badge}</Badge>
                  </div>

                  <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-[#eadfce] bg-[#efe7dc]">
                    <div className="h-64">
                      <PerfumeImage
                        imageUrl={preview.imageUrl}
                        perfumeName={preview.name}
                        brandName={preview.brandName}
                        fragranceFamily={preview.fragranceFamily}
                        sizes="(max-width: 1024px) 100vw, 360px"
                        priority
                      />
                    </div>
                  </div>

                  <div className="mt-5 space-y-4">
                    <div>
                      <h2 className="font-display text-3xl text-[#1f1914]">{preview.name}</h2>
                      <p className="mt-1 text-sm text-[#6b5b4b]">{preview.fragranceFamily}</p>
                    </div>

                    <div className="flex items-end justify-between gap-4 rounded-[1.25rem] border border-[#e6d8c5] bg-white/75 px-4 py-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a7763]">
                          {preview.bestPrice != null && preview.currency ? "Best price today" : "Discover"}
                        </p>
                        <p className="mt-1 font-display text-2xl text-[#1d1712]">
                          {preview.bestPrice != null && preview.currency
                            ? formatCurrency(preview.bestPrice, preview.currency)
                            : "View fragrance"}
                        </p>
                      </div>
                      <p className="text-right text-sm text-[#5d4e3f]">
                        {preview.storeName ?? "Odora fragrance page"}
                      </p>
                    </div>

                    <Link
                      href={preview.href}
                      className={buttonStyles({
                        variant: "secondary",
                        size: "lg",
                        className: "w-full bg-[#efe6da] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]",
                      })}
                    >
                      {preview.ctaLabel}
                    </Link>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  );
}
