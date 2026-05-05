import { useTranslations } from "next-intl";

import { Container } from "@/components/layout/Container";
import { buttonStyles } from "@/components/ui/Button";
import { Link } from "@/lib/navigation";

type HeroProps = {
  footer?: React.ReactNode;
};

export function Hero({ footer }: HeroProps) {
  const t = useTranslations("home.hero");

  return (
    <section className="pt-10 sm:pt-14 lg:pt-16">
      <Container>
        <div className="paper-texture relative overflow-hidden rounded-[2rem] border border-[#e7dbc9] bg-[linear-gradient(180deg,rgba(255,252,247,0.96),rgba(246,238,228,0.98))] px-6 py-8 text-[#1e1813] shadow-[0_30px_90px_-48px_rgba(45,31,18,0.28)] sm:px-10 sm:py-10 lg:px-12 lg:py-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_14%,rgba(255,255,255,0.85),transparent_32%),radial-gradient(circle_at_84%_18%,rgba(214,232,220,0.55),transparent_30%),radial-gradient(circle_at_82%_82%,rgba(232,214,188,0.46),transparent_28%)]" />
          <div className="pointer-events-none absolute inset-4 rounded-[1.55rem] border border-white/55 sm:inset-6" />
          <div className="pointer-events-none absolute left-0 top-0 h-full w-24 bg-[linear-gradient(180deg,rgba(217,183,127,0.12),transparent_38%,rgba(255,248,237,0.08)_100%)]" />
          <div className="pointer-events-none absolute -left-14 top-10 h-32 w-32 rounded-full bg-white/70 blur-[72px] sm:h-48 sm:w-48" />
          <div className="pointer-events-none absolute -right-12 bottom-2 h-44 w-44 rounded-full bg-[#e7d7c4]/55 blur-[80px] sm:h-56 sm:w-56" />

          <div className="relative">
            <div className="mx-auto max-w-[52rem] text-center">
              <p className="inline-flex rounded-full border border-[#e3d6c6] bg-white/70 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8c735e] shadow-[0_10px_24px_-18px_rgba(0,0,0,0.14)] sm:text-[10.5px] sm:tracking-[0.24em]">
                {t("eyebrow")}
              </p>

              <h1 className="mx-auto mt-5 max-w-[13ch] text-balance font-display text-[2.65rem] leading-[0.92] tracking-[-0.025em] text-[#1f1711] sm:mt-6 sm:max-w-[11ch] sm:text-[3.7rem] lg:max-w-[14ch] lg:text-[4.85rem] xl:max-w-[15ch]">
                {t("title")}
              </h1>

              <p className="mx-auto mt-4 max-w-[42rem] text-[15px] leading-[1.72] text-[#625243] sm:mt-5 sm:text-[16.5px] sm:leading-[1.8]">
                {t("subtitle")}
              </p>

              <div className="mt-6 flex justify-center sm:mt-7">
                <Link
                  href={{ pathname: "/finder", query: { start: "1" } }}
                  className={buttonStyles({
                    size: "lg",
                    className:
                      "w-full min-w-[16rem] shadow-[0_10px_26px_-12px_rgba(30,75,59,0.5)] sm:w-auto",
                  })}
                >
                  {t("startFinder")}
                </Link>
              </div>

            </div>
          </div>

          {footer ? (
            <div className="relative mt-8 border-t border-[#eadfce] pt-7 sm:mt-10 sm:pt-8">
              {footer}
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
