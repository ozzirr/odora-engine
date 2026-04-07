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
      <div className="rounded-[2rem] border border-[#e3d8c9] bg-[linear-gradient(160deg,rgba(255,255,255,0.8),rgba(244,237,227,0.95))] px-6 py-9 shadow-[0_24px_52px_-40px_rgba(50,35,20,0.32)] sm:px-8 sm:py-11 lg:px-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-12">
          {/* Left: heading */}
          <div className="lg:max-w-xs xl:max-w-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7763]">
              {t("eyebrow")}
            </p>
            <h2 className="mt-2.5 font-display text-[1.9rem] leading-tight text-[#1e1813] sm:text-[2.2rem]">
              {t("title")}
            </h2>
            <p className="mt-3 text-[13px] leading-[1.7] text-[#685848]">
              {t("subtitle")}
            </p>
          </div>

          {/* Right: store tiles */}
          <div className="flex-1 grid grid-cols-2 gap-3 xl:grid-cols-4">
            {stores.map((store) => (
              <div
                key={store}
                className="premium-card flex min-h-[5.5rem] items-center justify-center rounded-[1.3rem] border border-[#ddd2c3] bg-white/75 px-5 py-4 text-center shadow-[0_16px_40px_-36px_rgba(50,35,20,0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_48px_-34px_rgba(50,35,20,0.4)]"
              >
                <RetailerLogo storeName={store} align="center" size="md" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
