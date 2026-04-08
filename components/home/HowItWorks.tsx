"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { BuyIcon, CompareIcon, DiscoverIcon } from "@/components/home/HomeIllustrations";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "discover", Icon: DiscoverIcon, num: "01" },
  { key: "compare", Icon: CompareIcon, num: "02" },
  { key: "choose", Icon: BuyIcon, num: "03" },
] as const;

export function HowItWorks() {
  const t = useTranslations("home.howItWorks");
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.22,
        rootMargin: "0px 0px -8% 0px",
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="section-gap space-y-10">
      <SectionTitle
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {STEPS.map(({ key, Icon, num }, index) => {
          const reverseDelay = (STEPS.length - 1 - index) * 120;

          return (
            <article
              key={key}
              className={cn(
                "premium-card group relative overflow-hidden rounded-[var(--radius-card)] border border-[#ede4d8] bg-white/80 p-7 shadow-[var(--shadow-card)] transition-all duration-[680ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]",
                visible ? "translate-x-0 opacity-100" : "translate-x-12 opacity-0",
              )}
              style={{ transitionDelay: `${reverseDelay}ms` }}
            >
              <span
                className="pointer-events-none absolute right-5 top-3 select-none font-display text-[5rem] leading-none text-[#f2ebe1]"
                aria-hidden="true"
              >
                {num}
              </span>

              <div className="relative">
                <div className="flex h-11 w-11 items-center justify-center rounded-[0.85rem] border border-[#ede4d8] bg-[#f8f2e9] text-[#5a4938] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-5 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[#a09080]">
                  {num}
                </p>
                <h3 className="mt-1.5 font-display text-[1.6rem] leading-[1.1] text-[#1e1813]">
                  {t(`steps.${key}.title`)}
                </h3>
                <p className="mt-3 max-w-xs text-[14px] leading-[1.75] text-[#6b5a49]">
                  {t(`steps.${key}.description`)}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
