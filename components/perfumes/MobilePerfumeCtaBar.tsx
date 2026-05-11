"use client";

import { type ReactNode, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useLocale } from "next-intl";

import { buttonStyles } from "@/components/ui/Button";
import { APP_FLOATING_LAYER_CLASS } from "@/lib/chrome";
import { cn } from "@/lib/utils";

type MobilePerfumeCtaBarProps = {
  compareHref?: string;
  listAction?: ReactNode;
};

const FALLBACK_HERO_REVEAL_SCROLL_THRESHOLD_PX = 520;
const APP_HEADER_HEIGHT_PX = 72;
const HERO_SELECTOR = "[data-perfume-hero='true']";

export function MobilePerfumeCtaBar({
  compareHref = "#price-offers",
  listAction,
}: MobilePerfumeCtaBarProps) {
  const locale = useLocale();
  const barRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const hasAnyCta = Boolean(compareHref || listAction);
  const isBarActive = isVisible && !authModalOpen;

  useEffect(() => {
    if (!isClient) {
      return;
    }

    const root = document.documentElement;
    const updateAuthModalState = () => {
      setAuthModalOpen(root.getAttribute("data-auth-modal-open") === "true");
    };

    updateAuthModalState();

    const observer = new MutationObserver(updateAuthModalState);
    observer.observe(root, {
      attributeFilter: ["data-auth-modal-open"],
      attributes: true,
    });

    return () => observer.disconnect();
  }, [isClient]);

  useEffect(() => {
    if (!isClient || !hasAnyCta) {
      return;
    }

    const updateVisibility = () => {
      const hero = document.querySelector<HTMLElement>(HERO_SELECTOR);

      if (!hero) {
        setIsVisible(window.scrollY > FALLBACK_HERO_REVEAL_SCROLL_THRESHOLD_PX);
        return;
      }

      setIsVisible(hero.getBoundingClientRect().bottom <= APP_HEADER_HEIGHT_PX + 8);
    };

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    window.addEventListener("resize", updateVisibility);

    return () => {
      window.removeEventListener("scroll", updateVisibility);
      window.removeEventListener("resize", updateVisibility);
    };
  }, [hasAnyCta, isClient]);

  useEffect(() => {
    if (!isClient || !hasAnyCta || !isBarActive) {
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
  }, [compareHref, hasAnyCta, isBarActive, isClient]);

  if (!isClient || !hasAnyCta) {
    return null;
  }

  return createPortal(
    <div
      ref={barRef}
      data-mobile-perfume-cta="true"
      className={cn(
        "fixed inset-x-0 bottom-0 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:hidden",
        APP_FLOATING_LAYER_CLASS,
        isBarActive
          ? "translate-y-0"
          : "pointer-events-none translate-y-[calc(100%+env(safe-area-inset-bottom))]",
      )}
    >
      <div className="border-t border-[#ddcfbc] bg-[#fbf8f2]/90 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.85rem)] shadow-[0_-18px_40px_-28px_rgba(50,35,20,0.45)] backdrop-blur-md">
        <div className={cn("mx-auto grid w-full max-w-6xl gap-2", listAction ? "grid-cols-2" : "grid-cols-1")}>
          {listAction ? <div className="[&>*]:h-12 [&>*]:w-full [&>*]:rounded-2xl [&>*]:px-3 [&>*]:text-[13px]">{listAction}</div> : null}
          <a
            href={compareHref}
            className={buttonStyles({
              className:
                "h-12 w-full rounded-2xl bg-[#1e4b3b] text-[13px] shadow-[0_14px_28px_-18px_rgba(30,75,59,0.62)]",
            })}
          >
            {locale === "it" ? "Confronta prezzi" : "Compare prices"}
          </a>
        </div>
      </div>
    </div>,
    document.body,
  );
}
