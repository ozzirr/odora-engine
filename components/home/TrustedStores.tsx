import { useTranslations } from "next-intl";

import { RetailerLogo } from "@/components/perfumes/RetailerLogo";

type TrustedStoresProps = {
  stores: string[];
};

export function TrustedStores({ stores }: TrustedStoresProps) {
  const t = useTranslations("home.trustedStores");

  if (stores.length === 0) {
    return null;
  }

  const marqueeStores = [...stores, ...stores];

  return (
    <section className="section-gap">
      <div className="rounded-[var(--radius-card-lg)] border border-[#ede4d8] bg-[linear-gradient(160deg,rgba(255,255,255,0.88),rgba(246,239,229,0.94))] px-6 py-10 shadow-[var(--shadow-card)] sm:px-10 sm:py-12 lg:px-12">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[#907b66]">
            {t("eyebrow")}
          </p>
          <h2 className="mt-3 font-display text-[1.85rem] leading-[1.08] text-[#1e1813] sm:text-[2.3rem]">
            {t("title")}
          </h2>
          <p className="mt-3 text-[14px] leading-[1.75] text-[#6b5a49] sm:text-[15px]">
            {t("subtitle")}
          </p>
        </div>

        <div className="trusted-stores-marquee mt-8 overflow-hidden rounded-[1.8rem] border border-[#ebdfd1] bg-white/58 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] sm:mt-9 sm:py-5">
          <div className="trusted-stores-track">
            {marqueeStores.map((store, index) => (
              <div
                key={`${store}-${index}`}
                className="trusted-stores-pill mx-2 inline-flex min-h-[4.5rem] min-w-[10rem] items-center justify-center rounded-[1.35rem] border border-[#ede4d8] bg-white/88 px-6 py-4 shadow-[0_16px_30px_-24px_rgba(44,31,20,0.32)] sm:min-w-[11.5rem]"
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
    </section>
  );
}
