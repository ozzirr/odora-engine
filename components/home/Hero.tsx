import { useTranslations } from "next-intl";

import { Container } from "@/components/layout/Container";
import { HeroSpotlightCarousel } from "@/components/home/HeroSpotlightCarousel";
import { buttonStyles } from "@/components/ui/Button";
import type { HomePerfumeSpotlight } from "@/lib/homepage";
import { Link } from "@/lib/navigation";

type HeroProps = {
  previews: HomePerfumeSpotlight[];
};

export function Hero({ previews }: HeroProps) {
  const t = useTranslations("home.hero");
  const valueProps = [t("valueProps.compare"), t("valueProps.explore"), t("valueProps.choose")];

  return (
    <section className="pt-14 sm:pt-18">
      <Container>
        <div className="paper-texture relative overflow-hidden rounded-[2rem] border border-[#e4d8c8] bg-[#f8f3ea] px-7 py-8 shadow-[0_30px_90px_-55px_rgba(50,35,20,0.52)] sm:px-10 sm:py-12 lg:px-14 lg:py-14">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.75),transparent_34%),radial-gradient(circle_at_78%_18%,rgba(225,209,189,0.55),transparent_28%),linear-gradient(120deg,rgba(255,255,255,0.22),transparent_42%)]" />
          <div
            className={
              previews.length > 0
                ? "relative grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_390px] lg:items-center"
                : "relative"
            }
          >
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7763]">
                {t("eyebrow")}
              </p>
              <h1 className="mt-4 max-w-3xl font-display text-4xl leading-tight text-[#1c1712] sm:text-6xl">
                {t("title")}
              </h1>
              <p className="mt-5 max-w-2xl text-base text-[#5f5041] sm:text-lg">
                {t("subtitle")}
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
                  {t("browseCatalog")}
                </Link>
                <Link href="/finder" className={buttonStyles({ variant: "secondary", size: "lg" })}>
                  {t("startFinder")}
                </Link>
              </div>
            </div>

            {previews.length > 0 ? <HeroSpotlightCarousel previews={previews} /> : null}
          </div>
        </div>
      </Container>
    </section>
  );
}
