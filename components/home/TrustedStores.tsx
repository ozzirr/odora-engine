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

  return (
    <section className="mt-24">
      <div className="rounded-[2rem] border border-[#e3d8c9] bg-[linear-gradient(180deg,rgba(255,255,255,0.7),rgba(244,237,227,0.92))] px-6 py-8 shadow-[0_24px_52px_-40px_rgba(50,35,20,0.35)] sm:px-8 sm:py-10">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a7763]">
            {t("eyebrow")}
          </p>
          <h2 className="mt-3 font-display text-3xl text-[#1e1813] sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-3 text-sm text-[#685848]">
            {t("subtitle")}
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stores.map((store) => (
            <div
              key={store}
              className="premium-card flex min-h-24 items-center justify-center rounded-[1.5rem] border border-[#ddd2c3] bg-white/70 px-6 py-5 text-center shadow-[0_20px_44px_-38px_rgba(50,35,20,0.35)] transition-all duration-300 hover:-translate-y-1"
            >
              <RetailerLogo storeName={store} align="center" size="md" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
