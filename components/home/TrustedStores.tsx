import { useTranslations } from "next-intl";

import { RetailerLogo } from "@/components/perfumes/RetailerLogo";

type TrustedStoresProps = {
  stores: string[];
  variant?: "section" | "embedded";
};

export function TrustedStores({ stores, variant = "section" }: TrustedStoresProps) {
  const t = useTranslations("home.trustedStores");

  if (stores.length === 0) {
    return null;
  }

  const marqueeStores = [...stores, ...stores];
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
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[#907b66]">
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
              ? "trusted-stores-marquee mt-4 overflow-hidden rounded-[1.45rem] border border-[#e7dac8] bg-[linear-gradient(180deg,rgba(255,255,255,0.52),rgba(255,255,255,0.3))] py-3 shadow-[0_18px_34px_-28px_rgba(44,31,20,0.28),inset_0_1px_0_rgba(255,255,255,0.78)] sm:mt-5 sm:py-4"
              : "trusted-stores-marquee mt-8 overflow-hidden rounded-[1.8rem] border border-[#ebdfd1] bg-white/58 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] sm:mt-9 sm:py-5"
          }
        >
          <div className="trusted-stores-track">
            {marqueeStores.map((store, index) => (
              <div
                key={`${store}-${index}`}
                className={
                  isEmbedded
                    ? "trusted-stores-pill mx-1.5 inline-flex min-h-[4rem] min-w-[9.5rem] items-center justify-center rounded-[1.15rem] border border-[#e7dac8] bg-white/92 px-5 py-3 shadow-[0_12px_24px_-20px_rgba(44,31,20,0.26)] sm:min-w-[10.75rem]"
                    : "trusted-stores-pill mx-2 inline-flex min-h-[4.5rem] min-w-[10rem] items-center justify-center rounded-[1.35rem] border border-[#ede4d8] bg-white/88 px-6 py-4 shadow-[0_16px_30px_-24px_rgba(44,31,20,0.32)] sm:min-w-[11.5rem]"
                }
              >
                <RetailerLogo
                  storeName={store}
                  align="center"
                  size="md"
                  imageClassName="!max-h-6 sm:!max-h-7"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
  );

  if (isEmbedded) {
    return content;
  }

  return (
    <section className="section-gap">
      {content}
    </section>
  );
}
