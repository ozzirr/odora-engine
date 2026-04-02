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
        <div className="paper-texture relative overflow-hidden rounded-[2.2rem] border border-[#e4d8c8] bg-[#f8f3ea] px-6 py-9 shadow-[0_30px_90px_-55px_rgba(50,35,20,0.52)] sm:px-10 sm:py-12 lg:px-14 lg:py-16">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.75),transparent_34%),radial-gradient(circle_at_78%_18%,rgba(225,209,189,0.55),transparent_28%),linear-gradient(120deg,rgba(255,255,255,0.22),transparent_42%)]" />
          <div className="pointer-events-none absolute inset-4 rounded-[1.8rem] border border-white/45" />
          <div className="pointer-events-none absolute -left-14 top-14 h-40 w-40 rounded-full bg-white/35 blur-3xl sm:h-52 sm:w-52" />
          <div className="pointer-events-none absolute -right-12 bottom-6 h-52 w-52 rounded-full bg-[#eadbc6]/55 blur-3xl sm:h-64 sm:w-64" />

          <div className="relative mx-auto max-w-5xl text-center">
            <p className="inline-flex rounded-full border border-white/60 bg-white/55 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a7763] shadow-[0_14px_26px_-24px_rgba(52,37,24,0.44)] backdrop-blur-[2px]">
              {t("eyebrow")}
            </p>
            <h1 className="mx-auto mt-6 max-w-4xl font-display text-5xl leading-[0.98] text-[#1c1712] sm:text-6xl lg:text-[5.15rem]">
              {t("title")}
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-base leading-7 text-[#5f5041] sm:text-xl sm:leading-8">
              {t("subtitle")}
            </p>

            <ul className="mt-8 grid gap-3 text-left sm:grid-cols-3">
              {valueProps.map((item) => (
                <li
                  key={item}
                  className="rounded-[1.35rem] border border-white/70 bg-white/52 px-4 py-4 text-sm text-[#584839] shadow-[0_20px_38px_-32px_rgba(52,37,24,0.48)] backdrop-blur-[2px] sm:px-5 sm:py-5 sm:text-[15px]"
                >
                  <span className="flex items-start gap-3">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#7d6853]" />
                    <span>{item}</span>
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/perfumes"
                className={buttonStyles({ size: "lg", className: "min-w-[11rem]" })}
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
          </div>
        </div>
      </Container>
    </section>
  );
}
