"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";

import { APP_HEADER_OFFSET_CLASS, APP_OVERLAY_LAYER_CLASS } from "@/lib/chrome";
import { lockDocumentScroll } from "@/lib/document-scroll-lock";
import { useRouter } from "@/lib/navigation";
import { usePerfumeDetailNavigation } from "@/components/perfumes/PerfumeDetailNavigation";
import { cn } from "@/lib/utils";

const TRANSITION_MS = 260;

type SearchResult = {
  id: string;
  slug: string;
  name: string;
  fragranceFamily: string;
  imageUrl: string | null;
  brand: { name: string };
};

type SearchDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function SearchDialog({ open, onClose }: SearchDialogProps) {
  const t = useTranslations("layout.header.search");
  const router = useRouter();
  const { startNavigation } = usePerfumeDetailNavigation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mount / unmount with transition — mirrors AuthModalOverlay
  useEffect(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    if (open) {
      setIsRendered(true);
      const frameId = requestAnimationFrame(() => {
        setIsVisible(true);
        inputRef.current?.focus();
      });
      return () => cancelAnimationFrame(frameId);
    }

    const frameId = requestAnimationFrame(() => setIsVisible(false));
    closeTimeoutRef.current = setTimeout(() => {
      setIsRendered(false);
      setQuery("");
      setResults([]);
      setSearched(false);
    }, TRANSITION_MS);

    return () => {
      cancelAnimationFrame(frameId);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, [open]);

  // Scroll lock while open
  useEffect(() => {
    if (!isRendered) return;
    return lockDocumentScroll();
  }, [isRendered]);

  // Escape key
  useEffect(() => {
    if (!isRendered) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isRendered, onClose]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = (await res.json()) as { results: SearchResult[] };
          setResults(data.results);
        } else {
          setResults([]);
        }
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
        setSearched(true);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleSelect = (slug: string, name: string) => {
    onClose();
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    startNavigation(name);
    router.push({ pathname: "/perfumes/[slug]", params: { slug } });
  };

  if (!isRendered) return null;

  return (
    <div
      className={cn(
        `fixed inset-x-0 bottom-0 ${APP_HEADER_OFFSET_CLASS} overflow-y-auto px-3 py-4 transition-[background-color,opacity,backdrop-filter] duration-[260ms] ease-[cubic-bezier(0.22,1,0.36,1)] sm:px-6 sm:py-8 lg:px-8`,
        APP_OVERLAY_LAYER_CLASS,
        isVisible
          ? "bg-[rgba(24,20,16,0.22)] opacity-100 backdrop-blur-[18px]"
          : "pointer-events-none bg-[rgba(24,20,16,0)] opacity-0 backdrop-blur-none",
      )}
      onClick={onClose}
    >
      <div className="flex min-h-full items-start justify-center pt-1 sm:items-center sm:pt-0">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("label")}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "w-full max-w-[58rem] transition-[opacity,transform] duration-[260ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
            isVisible ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-[0.985] opacity-0",
          )}
        >
          {/* Glass panel — same style as AuthPanel surface="glass" */}
          <div className="relative isolate overflow-hidden rounded-[2rem] border border-white/55 bg-[linear-gradient(180deg,rgba(255,255,255,0.74),rgba(248,242,234,0.58))] p-5 shadow-[0_40px_120px_-40px_rgba(29,22,16,0.62)] backdrop-blur-[28px] before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.42),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(226,211,192,0.28),transparent_34%)] before:content-[''] sm:p-7 lg:p-8">
            {/* Close button — same as AuthPanel */}
            <button
              type="button"
              onClick={onClose}
              aria-label={t("close")}
              className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/45 bg-white/50 text-xl leading-none text-[#47372a] transition hover:bg-white/70 sm:right-5 sm:top-5 sm:h-11 sm:w-11"
            >
              <span aria-hidden="true">×</span>
            </button>

            {/* Header */}
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8b7762] sm:text-xs">
              {t("eyebrow")}
            </p>
            <h2 className="mt-2 pr-12 font-display text-[2.15rem] leading-[0.96] tracking-[-0.02em] text-[#21180f] sm:text-[2.65rem]">
              {t("title")}
            </h2>

            {/* Search input */}
            <div className="mt-5 flex items-center gap-3 rounded-[1.4rem] border border-[#ddd0be] bg-white/80 px-4 py-3.5 shadow-[inset_0_1px_3px_rgba(30,22,14,0.06)] focus-within:border-[#c0aa8e] focus-within:ring-2 focus-within:ring-[#c0aa8e]/20 sm:px-5 sm:py-4">
              <svg
                viewBox="0 0 20 20"
                fill="none"
                className="h-5 w-5 shrink-0 text-[#9a8570] sm:h-6 sm:w-6"
                aria-hidden="true"
              >
                <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.6" />
                <path d="M14 14l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("placeholder")}
                className="min-w-0 flex-1 bg-transparent text-[1.15rem] leading-none text-[#1c1712] placeholder:text-[#b0a090] focus:outline-none sm:text-[1.35rem]"
              />
              {isLoading && (
                <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-[#d4c8b8] border-t-[#8a7060] sm:h-5 sm:w-5" />
              )}
            </div>

            {/* Results list */}
            {results.length > 0 && (
              <ul className="mt-4 max-h-[min(62dvh,38rem)] overflow-y-auto rounded-[1.35rem] border border-[#e8ddd0] bg-white/70">
                {results.map((perfume, i) => (
                  <li key={perfume.id} className={i > 0 ? "border-t border-[#f0e8de]" : ""}>
                    <button
                      type="button"
                      onClick={() => handleSelect(perfume.slug, perfume.name)}
                      className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[#fdf6ee] sm:gap-4 sm:px-5 sm:py-4"
                    >
                      <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-xl bg-[#f5ede3] sm:h-16 sm:w-14">
                        {perfume.imageUrl ? (
                          <Image
                            src={perfume.imageUrl}
                            alt={perfume.name}
                            fill
                            sizes="56px"
                            className="object-contain p-1.5"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[1rem] font-semibold leading-[1.2] text-[#1c1712] sm:text-[1.08rem]">
                          {perfume.name}
                        </p>
                        <p className="truncate text-[0.88rem] text-[#7a6a58] sm:text-[0.95rem]">
                          {perfume.brand.name}
                          {perfume.fragranceFamily ? (
                            <span className="ml-1.5 opacity-60">· {perfume.fragranceFamily}</span>
                          ) : null}
                        </p>
                      </div>
                      <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4 shrink-0 text-[#b0a090] sm:h-5 sm:w-5" aria-hidden="true">
                        <path d="M4 12L12 4M6 4H12V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {searched && results.length === 0 && query.length >= 2 && (
              <p className="mt-5 text-center text-sm text-[#9a8570]">
                {t("noResults", { query })}
              </p>
            )}

            {!searched && query.length < 2 && (
              <p className="mt-5 text-center text-[12px] text-[#b0a090] sm:text-[13px]">
                {t("hint")}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
