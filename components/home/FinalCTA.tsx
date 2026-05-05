import { useTranslations } from "next-intl";

import { buttonStyles } from "@/components/ui/Button";
import { Link } from "@/lib/navigation";

export function FinalCTA() {
  const t = useTranslations("home.finalCta");

  return (
    <section className="section-gap">
      <div className="paper-texture relative overflow-hidden rounded-[var(--radius-card-lg)] border border-[#ded1c0] bg-[linear-gradient(135deg,#f7f1e7_0%,#fbf8f2_52%,#eef4ef_100%)] px-6 py-14 shadow-[0_22px_64px_-30px_rgba(50,35,20,0.28)] sm:px-12 sm:py-18 lg:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(255,255,255,0.74),transparent_36%),radial-gradient(circle_at_78%_80%,rgba(214,229,218,0.42),transparent_28%)]" />
        <div className="pointer-events-none absolute inset-5 rounded-[1.6rem] border border-white/40" />

        <div className="relative mx-auto grid max-w-5xl gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.8fr)] lg:items-center">
          <div className="text-center lg:text-left">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.24em] text-[#907b66]">
              {t("eyebrow")}
            </p>
            <h2 className="mx-auto mt-5 max-w-[12ch] font-display text-[2.2rem] leading-[1.02] tracking-[-0.01em] text-[#1c1712] sm:max-w-none sm:text-[2.8rem] lg:mx-0 lg:max-w-[10ch] lg:text-[3.25rem]">
              {t("title")}
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-[15px] leading-[1.75] text-[#6b5a49] lg:mx-0">
              {t("subtitle")}
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3.5 lg:justify-start">
              <Link
                href="/perfumes"
                className={buttonStyles({
                  size: "lg",
                  className: "min-w-[12rem] shadow-[0_6px_20px_-8px_rgba(30,75,59,0.45)]",
                })}
              >
                {t("primaryCta")}
              </Link>
              <Link
                href="/finder"
                className={buttonStyles({
                  variant: "secondary",
                  size: "lg",
                  className: "min-w-[11rem]",
                })}
              >
                {t("secondaryCta")}
              </Link>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-white/60 bg-white/72 p-5 shadow-[0_18px_42px_-30px_rgba(50,35,20,0.2)] sm:p-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8b735d]">
              {t("panelEyebrow")}
            </p>
            <div className="mt-4 space-y-3">
              {["catalog", "finder", "brands"].map((key) => (
                <div key={key} className="rounded-[1rem] border border-[#eadfce] bg-[#fcfaf6] px-4 py-3">
                  <p className="font-display text-[1.2rem] leading-none text-[#21180f]">
                    {t(`panel.${key}.title`)}
                  </p>
                  <p className="mt-2 text-[13.5px] leading-6 text-[#6a5846]">
                    {t(`panel.${key}.body`)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
