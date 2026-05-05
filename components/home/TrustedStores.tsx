import { useTranslations } from "next-intl";

import { getCuratedBrandLogoUrl } from "@/lib/brand-logos";

type BrandLogoStripProps = {
  brands: string[];
  variant?: "section" | "embedded";
};

const FALLBACK_BRANDS = [
  "Dior",
  "Chanel",
  "Tom Ford",
  "Xerjoff",
  "Prada",
  "Guerlain",
  "Hermes",
  "Casamorati",
];

export function BrandLogoStrip({ brands, variant = "section" }: BrandLogoStripProps) {
  const t = useTranslations("home.brandStrip");
  const logoReadyBrands = (brands.length > 0 ? brands : FALLBACK_BRANDS).filter((brand) =>
    getCuratedBrandLogoUrl(brand),
  );
  const brandNames = logoReadyBrands.length > 0 ? logoReadyBrands : FALLBACK_BRANDS;
  const marqueeBrands = [...brandNames, ...brandNames];
  const isEmbedded = variant === "embedded";

  const content = (
    <div
      className={
        isEmbedded
          ? "px-1 py-1 sm:px-2"
          : "rounded-[var(--radius-card-lg)] border border-[#ede4d8] bg-[linear-gradient(160deg,rgba(255,255,255,0.88),rgba(246,239,229,0.94))] px-6 py-10 shadow-[var(--shadow-card)] sm:px-10 sm:py-12 lg:px-12"
      }
    >
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[#d9b77f]">
          {t("eyebrow")}
        </p>
        {isEmbedded ? null : (
          <h2 className="mt-3 font-display text-[1.85rem] leading-[1.08] text-[#1e1813] sm:text-[2.3rem]">
            {t("title")}
          </h2>
        )}
      </div>

      <div
        className={
          isEmbedded
            ? "trusted-stores-marquee mt-4 overflow-hidden rounded-[1.45rem] border border-white/12 bg-white/[0.08] py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] sm:mt-5 sm:py-4"
            : "trusted-stores-marquee mt-8 overflow-hidden rounded-[1.8rem] border border-[#ebdfd1] bg-white/58 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] sm:mt-9 sm:py-5"
        }
      >
        <div className="trusted-stores-track">
          {marqueeBrands.map((brand, index) => {
            const logoUrl = getCuratedBrandLogoUrl(brand);

            return (
              <div
                key={`${brand}-${index}`}
                className={
                  isEmbedded
                    ? "trusted-stores-pill mx-1.5 inline-flex min-h-[4rem] min-w-[10.5rem] items-center justify-center gap-3 rounded-[1.15rem] border border-white/12 bg-[#fff8ed]/94 px-5 py-3 text-[#211914] shadow-[0_14px_30px_-24px_rgba(0,0,0,0.48)] sm:min-w-[12rem]"
                    : "trusted-stores-pill mx-2 inline-flex min-h-[4.5rem] min-w-[11rem] items-center justify-center gap-3 rounded-[1.35rem] border border-[#ede4d8] bg-white/88 px-6 py-4 text-[#211914] shadow-[0_16px_30px_-24px_rgba(44,31,20,0.32)] sm:min-w-[12.5rem]"
                }
              >
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt={`${brand} logo`}
                    className="h-9 w-9 shrink-0 rounded-full border border-[#dfcfbc] bg-white object-contain p-1.5"
                    loading="lazy"
                  />
                ) : null}
                <span className="max-w-[9rem] truncate font-display text-[1.08rem] leading-none tracking-[0.02em]">
                  {brand}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  if (isEmbedded) {
    return content;
  }

  return <section className="section-gap">{content}</section>;
}
