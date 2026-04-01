"use client";

import Image from "next/image";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";

import { buttonStyles } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type MobilePerfumeCtaBarProps = {
  bestOfferUrl?: string | null;
  amazonUrl?: string | null;
};

function AmazonWordmark({ className }: { className?: string }) {
  return (
    <Image
      src="/images/logo_amazon.webp"
      alt="Amazon"
      width={110}
      height={34}
      className={cn("brightness-0 invert", className)}
    />
  );
}

export function MobilePerfumeCtaBar({
  bestOfferUrl,
  amazonUrl,
}: MobilePerfumeCtaBarProps) {
  const heroT = useTranslations("perfume.hero");
  const amazonT = useTranslations("perfume.amazon");
  const barRef = useRef<HTMLDivElement | null>(null);
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    if (!isClient || (!bestOfferUrl && !amazonUrl)) {
      return;
    }

    const root = document.documentElement;

    const updateOffset = () => {
      const nextOffset = barRef.current?.offsetHeight ?? 0;
      root.style.setProperty("--mobile-perfume-cta-offset", `${nextOffset}px`);
    };

    root.setAttribute("data-mobile-perfume-cta-active", "true");
    updateOffset();

    const resizeObserver =
      typeof ResizeObserver === "undefined" || !barRef.current
        ? null
        : new ResizeObserver(() => updateOffset());

    if (resizeObserver && barRef.current) {
      resizeObserver.observe(barRef.current);
    }

    window.addEventListener("resize", updateOffset);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateOffset);
      root.removeAttribute("data-mobile-perfume-cta-active");
      root.style.removeProperty("--mobile-perfume-cta-offset");
    };
  }, [amazonUrl, bestOfferUrl, isClient]);

  if (!isClient || (!bestOfferUrl && !amazonUrl)) {
    return null;
  }

  return createPortal(
    <div
      ref={barRef}
      data-mobile-perfume-cta="true"
      className="fixed inset-x-0 bottom-0 z-[70] transition-[opacity,transform] duration-200 ease-out sm:hidden"
    >
      <div className="border-t border-[#ddcfbc] bg-[#fbf8f2]/96 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.9rem)] shadow-[0_-18px_40px_-28px_rgba(50,35,20,0.45)] backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2">
          {bestOfferUrl ? (
            <a
              href={bestOfferUrl}
              target="_blank"
              rel="noreferrer"
              className={buttonStyles({ className: "h-12 w-full" })}
            >
              {heroT("goToOffer")}
            </a>
          ) : null}

          {amazonUrl ? (
            <a
              href={amazonUrl}
              target="_blank"
              rel="noreferrer"
              className={buttonStyles({
                className:
                  "h-12 w-full bg-[#ffb647] !text-[#23170c] hover:bg-[#f0a62f] hover:!text-[#23170c]",
              })}
            >
              <span className="inline-flex items-center gap-2">
                <span>{amazonT("ctaPrefix")}</span>
                <span className="inline-flex min-w-[86px] items-center justify-center">
                  <AmazonWordmark className="h-[22px] w-auto object-contain translate-y-[1px]" />
                </span>
              </span>
            </a>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
