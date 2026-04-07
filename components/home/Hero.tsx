import { useTranslations } from "next-intl";

import { Container } from "@/components/layout/Container";
import { buttonStyles } from "@/components/ui/Button";
import { Link } from "@/lib/navigation";

export function Hero() {
  const t = useTranslations("home.hero");
  const valueProps = [t("valueProps.compare"), t("valueProps.explore"), t("valueProps.choose")];

  return (
    <section className="pt-14 sm:pt-18">
      <Container>
        <div className="paper-texture relative overflow-hidden rounded-[2.2rem] border border-[#e4d8c8] bg-[#f8f3ea] px-6 py-12 shadow-[0_30px_90px_-55px_rgba(50,35,20,0.52)] sm:px-10 sm:py-16 lg:px-16 lg:py-20">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.75),transparent_34%),radial-gradient(circle_at_78%_18%,rgba(225,209,189,0.55),transparent_28%),linear-gradient(120deg,rgba(255,255,255,0.22),transparent_42%)]" />
          <div className="pointer-events-none absolute inset-4 rounded-[1.8rem] border border-white/45" />
          <div className="pointer-events-none absolute -left-14 top-14 h-40 w-40 rounded-full bg-white/35 blur-3xl sm:h-56 sm:w-56" />
          <div className="pointer-events-none absolute -right-12 bottom-6 h-52 w-52 rounded-full bg-[#eadbc6]/55 blur-3xl sm:h-72 sm:w-72" />

          <div className="relative mx-auto max-w-3xl text-center">
            <p className="inline-flex rounded-full border border-white/60 bg-white/55 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a7763] shadow-[0_14px_26px_-24px_rgba(52,37,24,0.44)] backdrop-blur-[2px]">
              {t("eyebrow")}
            </p>

            <h1 className="mx-auto mt-5 font-display text-[2.9rem] leading-[0.97] text-[#1c1712] sm:text-[4.2rem] lg:text-[5.4rem]">
              {t("title")}
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-[#5f5041] sm:text-[1.05rem] sm:leading-8">
              {t("subtitle")}
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/perfumes"
                className={buttonStyles({
                  size: "lg",
                  className: "min-w-[11rem] shadow-[0_8px_24px_-12px_rgba(30,75,59,0.5)]",
                })}
              >
                {t("browseCatalog")}
              </Link>
              <Link
                href="/finder"
                className={buttonStyles({
                  variant: "secondary",
                  size: "lg",
                  className: "min-w-[10rem]",
                })}
              >
                {t("startFinder")}
              </Link>
            </div>

            <ul className="mt-8 flex flex-col items-center gap-1.5 sm:flex-row sm:justify-center sm:gap-x-1 sm:gap-y-0">
              {valueProps.map((item, i) => (
                <li key={item} className="flex items-center gap-1">
                  {i > 0 && <span className="hidden sm:inline-block mx-1.5 h-3 w-px bg-[#c8bba8]" aria-hidden="true" />}
                  <span className="text-[12px] text-[#6e5d4c] sm:text-[13px]">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
