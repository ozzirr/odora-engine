import { useTranslations } from "next-intl";

import { BuyIcon, CompareIcon, DiscoverIcon } from "@/components/home/HomeIllustrations";
import { SectionTitle } from "@/components/ui/SectionTitle";

export function HowItWorks() {
  const t = useTranslations("home.howItWorks");
  const steps = [
    {
      key: "discover",
      title: t("steps.discover.title"),
      description: t("steps.discover.description"),
      Icon: DiscoverIcon,
    },
    {
      key: "compare",
      title: t("steps.compare.title"),
      description: t("steps.compare.description"),
      Icon: CompareIcon,
    },
    {
      key: "choose",
      title: t("steps.choose.title"),
      description: t("steps.choose.description"),
      Icon: BuyIcon,
    },
  ];

  return (
    <section className="mt-24 space-y-8">
      <SectionTitle
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
      />

      <div className="grid gap-5 lg:grid-cols-3">
        {steps.map(({ key, title, description, Icon }) => (
          <article
            key={key}
            className="premium-card rounded-[1.75rem] border border-[#e4d8c8] bg-white/80 p-7 shadow-[0_24px_48px_-36px_rgba(50,35,20,0.4)] transition-all duration-300 hover:-translate-y-1"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#e5d9c9] bg-[#f5ede2] text-[#5a4938] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
              <Icon className="h-6 w-6" />
            </div>
            <h3 className="mt-5 font-display text-3xl text-[#1f1914]">{title}</h3>
            <p className="mt-3 max-w-xs text-sm leading-6 text-[#5e4f40]">{description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
