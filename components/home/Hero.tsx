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
        <div className="relative overflow-hidden rounded-[2rem] border border-white/12 bg-[#211914] px-6 py-8 text-[#fff8ed] shadow-[0_26px_78px_-34px_rgba(20,14,10,0.62)] sm:px-10 sm:py-10 lg:px-12 lg:py-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(238,205,157,0.3),transparent_31%),radial-gradient(circle_at_82%_18%,rgba(111,139,111,0.22),transparent_28%),linear-gradient(135deg,#1b1511_0%,#33241c_50%,#14120f_100%)]" />
          <div className="pointer-events-none absolute inset-4 rounded-[1.55rem] border border-white/12 sm:inset-6" />
          <div className="pointer-events-none absolute left-0 top-0 h-full w-24 bg-[linear-gradient(180deg,rgba(217,183,127,0.18),transparent_38%,rgba(255,248,237,0.06)_100%)]" />
          <div className="pointer-events-none absolute -left-16 top-8 h-36 w-36 rounded-full bg-[#d9b77f]/18 blur-[72px] sm:h-52 sm:w-52" />
          <div className="pointer-events-none absolute -right-14 bottom-0 h-44 w-44 rounded-full bg-white/10 blur-[74px] sm:h-60 sm:w-60" />

          <div className="relative">
            <div className="mx-auto max-w-[46rem] text-center">
              <p className="inline-flex rounded-full border border-white/18 bg-white/[0.08] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#d9b77f] shadow-[0_10px_24px_-18px_rgba(0,0,0,0.5)] backdrop-blur-[2px] sm:text-[10.5px] sm:tracking-[0.24em]">
                {t("eyebrow")}
              </p>

              <h1 className="mx-auto mt-5 max-w-[12.5ch] text-balance font-display text-[2.65rem] leading-[0.92] tracking-[-0.025em] text-[#fff8ed] sm:mt-6 sm:max-w-[10.5ch] sm:text-[3.7rem] lg:max-w-[15ch] lg:text-[4.7rem] xl:max-w-[16ch]">
                {t("title")}
              </h1>

              <p className="mx-auto mt-4 max-w-[38rem] text-[15px] leading-[1.66] text-[#dac8ad] sm:mt-5 sm:text-[16.5px] sm:leading-[1.76]">
                {t("subtitle")}
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:mt-7 sm:flex-row sm:flex-wrap sm:justify-center">
                <Link
                  href={{ pathname: "/finder", query: { start: "1" } }}
                  className={buttonStyles({
                    size: "lg",
                    className:
                      "w-full min-w-[12rem] shadow-[0_10px_26px_-12px_rgba(30,75,59,0.5)] sm:w-auto",
                  })}
                >
                  {t("startFinder")}
                </Link>
              </div>
            </div>
          </div>

          {footer ? (
            <div className="relative mt-8 border-t border-white/12 pt-7 sm:mt-10 sm:pt-8">
              {footer}
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
