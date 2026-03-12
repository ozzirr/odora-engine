"use client";

import { startTransition, useEffect, useState } from "react";
import type { ComponentProps, CSSProperties } from "react";
import { useLocale, useTranslations } from "next-intl";

import { PerfumeDetailLink } from "@/components/perfumes/PerfumeDetailLink";
import { PerfumeImage } from "@/components/perfumes/PerfumeImage";
import { Badge } from "@/components/ui/Badge";
import { buttonStyles } from "@/components/ui/Button";
import type { HomePerfumeSpotlight } from "@/lib/homepage";
import { cn, formatCurrency } from "@/lib/utils";

type HeroSpotlightCarouselProps = {
  previews: HomePerfumeSpotlight[];
};

type LinkHref = ComponentProps<typeof PerfumeDetailLink>["href"];

function getStackCardStyle(offset: number): CSSProperties {
  if (offset === 0) {
    return {
      opacity: 1,
      transform: "translate3d(0, 0, 0) scale(1) rotate(0deg)",
      filter: "saturate(1)",
    };
  }

  if (offset === 1) {
    return {
      opacity: 0.96,
      transform: "translate3d(12px, 64px, 0) scale(0.968) rotate(1.2deg)",
      filter: "saturate(0.92)",
    };
  }

  if (offset === 2) {
    return {
      opacity: 0.74,
      transform: "translate3d(24px, 132px, 0) scale(0.936) rotate(2.3deg)",
      filter: "saturate(0.8)",
    };
  }

  return {
    opacity: 0,
    transform: "translate3d(34px, 188px, 0) scale(0.9) rotate(3.4deg)",
    filter: "saturate(0.72)",
  };
}

export function HeroSpotlightCarousel({ previews }: HeroSpotlightCarouselProps) {
  const t = useTranslations("home.hero");
  const locale = useLocale();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotionPreference = () => setPrefersReducedMotion(mediaQuery.matches);

    syncMotionPreference();
    mediaQuery.addEventListener("change", syncMotionPreference);

    return () => {
      mediaQuery.removeEventListener("change", syncMotionPreference);
    };
  }, []);

  useEffect(() => {
    if (previews.length < 2 || isPaused || prefersReducedMotion) {
      return;
    }

    const intervalId = window.setInterval(() => {
      startTransition(() => {
        setActiveIndex((currentIndex) => (currentIndex + 1) % previews.length);
      });
    }, 4200);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isPaused, prefersReducedMotion, previews.length]);

  if (previews.length === 0) {
    return null;
  }

  const stackedPreviews = previews
    .map((preview, index) => ({
      preview,
      index,
      offset: (index - activeIndex + previews.length) % previews.length,
    }))
    .sort((left, right) => right.offset - left.offset);

  return (
    <div
      className="relative h-[40rem] sm:h-[41rem] lg:h-[42rem]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="absolute inset-x-0 top-0 h-[34.5rem] sm:h-[35.5rem]">
        {stackedPreviews.map(({ preview, index, offset }) => {
          const isActive = offset === 0;

          return (
            <article
              key={`${preview.href}-${preview.name}`}
              aria-hidden={!isActive}
              className={cn(
                "premium-card absolute inset-x-0 top-0 overflow-hidden rounded-[1.75rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(247,239,229,0.94))] p-5 shadow-[0_28px_60px_-42px_rgba(45,31,19,0.55)] transition-[transform,opacity,filter] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
                isActive ? "pointer-events-auto" : "pointer-events-none",
              )}
              style={{
                ...getStackCardStyle(offset),
                zIndex: previews.length - offset,
              }}
            >
              <div className="absolute inset-x-6 top-0 h-24 rounded-b-[2rem] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.85),transparent_72%)]" />
              <div className="relative flex h-full flex-col">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7763]">
                      {t("spotlight")}
                    </p>
                    <p className="mt-1 text-sm text-[#5e4f40]">{preview.brandName}</p>
                  </div>
                  <Badge className="bg-[#1f1914] text-[#f8f4ed]">
                    {t(`badges.${preview.badgeKey}`)}
                  </Badge>
                </div>

                <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-[#eadfce] bg-[#efe7dc]">
                  <div className="h-60 sm:h-64">
                    <PerfumeImage
                      imageUrl={preview.imageUrl}
                      perfumeName={preview.name}
                      brandName={preview.brandName}
                      fragranceFamily={preview.fragranceFamily}
                      sizes="(max-width: 1024px) 100vw, 390px"
                      priority={index === 0}
                      imageClassName={cn(
                        "transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
                        isActive ? "scale-100" : "scale-[1.03]",
                      )}
                    />
                  </div>
                </div>

                <div className="mt-5 flex flex-1 flex-col justify-between space-y-4">
                  <div>
                    <h2 className="font-display text-3xl text-[#1f1914]">{preview.name}</h2>
                    <p className="mt-1 text-sm text-[#6b5b4b]">{preview.fragranceFamily}</p>
                  </div>

                  <div className="flex items-end justify-between gap-4 rounded-[1.25rem] border border-[#e6d8c5] bg-white/75 px-4 py-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a7763]">
                        {preview.bestPrice != null && preview.currency
                          ? t("bestPriceToday")
                          : t("discover")}
                      </p>
                      <p className="mt-1 font-display text-2xl text-[#1d1712]">
                        {preview.bestPrice != null && preview.currency
                          ? formatCurrency(
                              preview.bestPrice,
                              preview.currency,
                              locale as "it" | "en",
                            )
                          : t("viewFragrance")}
                      </p>
                    </div>
                    <p className="text-right text-sm text-[#5d4e3f]">
                      {preview.storeName ?? t("fallbackStore")}
                    </p>
                  </div>

                  <PerfumeDetailLink
                    href={preview.href as unknown as LinkHref}
                    perfumeName={preview.name}
                    className={buttonStyles({
                      variant: "secondary",
                      size: "lg",
                      className: "w-full bg-[#efe6da] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]",
                    })}
                  >
                    {preview.hasOffer ? t("viewOffers") : t("seeProductDetails")}
                  </PerfumeDetailLink>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {previews.length > 1 ? (
        <div className="absolute bottom-0 left-3 right-3 flex items-center justify-center gap-2">
          {previews.map((preview, index) => {
            const isActive = index === activeIndex;

            return (
              <button
                key={`${preview.href}-dot`}
                type="button"
                aria-label={`${preview.brandName} ${preview.name}`}
                onClick={() => setActiveIndex(index)}
                className={cn(
                  "h-2.5 rounded-full bg-[#cfbca7] transition-all duration-300",
                  isActive ? "w-10 bg-[#1E4B3B]" : "w-2.5 hover:bg-[#9f8469]",
                )}
              />
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
