"use client";

import { useEffect, type ReactNode } from "react";

import { Link } from "@/lib/navigation";

const BRAND_SCROLL_TARGET_KEY = "odora:brand-list-scroll-target";

type BrandListLinkProps = {
  slug: string;
  brandName: string;
  className: string;
  children: ReactNode;
};

function scrollToBrand(slug: string) {
  const selector = `[data-brand-slug="${window.CSS.escape(slug)}"]`;
  const target = document.querySelector<HTMLElement>(selector);

  if (!target) {
    return false;
  }

  target.scrollIntoView({ block: "center", inline: "nearest", behavior: "auto" });
  return true;
}

export function BrandListScrollRestore() {
  useEffect(() => {
    const slug = window.sessionStorage.getItem(BRAND_SCROLL_TARGET_KEY);

    if (!slug) {
      return;
    }

    let cancelled = false;
    const timeouts: number[] = [];

    const restore = () => {
      if (cancelled || scrollToBrand(slug)) {
        window.sessionStorage.removeItem(BRAND_SCROLL_TARGET_KEY);
      }
    };

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(restore);
    });

    timeouts.push(window.setTimeout(restore, 160));
    timeouts.push(window.setTimeout(restore, 420));

    return () => {
      cancelled = true;
      for (const timeout of timeouts) {
        window.clearTimeout(timeout);
      }
    };
  }, []);

  return null;
}

export function BrandListLink({ slug, brandName, className, children }: BrandListLinkProps) {
  return (
    <Link
      href={{ pathname: "/brands/[slug]", params: { slug } }}
      className={className}
      aria-label={brandName}
      data-brand-slug={slug}
      onClick={() => {
        window.sessionStorage.setItem(BRAND_SCROLL_TARGET_KEY, slug);
      }}
    >
      {children}
    </Link>
  );
}
