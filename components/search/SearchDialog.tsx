"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";

import { useRouter } from "@/lib/navigation";

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
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setSearched(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

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

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const handleSelect = (slug: string) => {
    onClose();
    router.push({ pathname: "/perfumes/[slug]", params: { slug } });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Chiudi ricerca"
        className="absolute inset-0 bg-[rgba(24,20,16,0.38)] backdrop-blur-[18px]"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative mx-auto mt-20 w-full max-w-lg px-4 sm:px-0">
        <div className="overflow-hidden rounded-[1.8rem] border border-[#e8ddd0] bg-[#fdfaf6] shadow-[0_40px_100px_-40px_rgba(30,22,14,0.55)]">
          {/* Input row */}
          <div className="flex items-center gap-3 border-b border-[#ede4d7] px-5 py-4">
            <svg
              viewBox="0 0 20 20"
              fill="none"
              className="h-5 w-5 shrink-0 text-[#9a8570]"
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
              className="min-w-0 flex-1 bg-transparent text-[15px] text-[#1c1712] placeholder:text-[#b0a090] focus:outline-none"
            />
            {isLoading && (
              <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-[#d4c8b8] border-t-[#8a7060]" />
            )}
          </div>

          {/* Results */}
          {results.length > 0 && (
            <ul className="max-h-[360px] overflow-y-auto py-2">
              {results.map((perfume) => (
                <li key={perfume.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(perfume.slug)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[#f5ede3]"
                  >
                    <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded-lg bg-[#f0e8dc]">
                      {perfume.imageUrl ? (
                        <Image
                          src={perfume.imageUrl}
                          alt={perfume.name}
                          fill
                          sizes="40px"
                          className="object-contain p-1"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-[#1c1712]">
                        {perfume.name}
                      </p>
                      <p className="truncate text-[12px] text-[#7a6a58]">
                        {perfume.brand.name}
                        {perfume.fragranceFamily ? ` · ${perfume.fragranceFamily}` : ""}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {searched && results.length === 0 && query.length >= 2 && (
            <p className="px-5 py-6 text-center text-[13px] text-[#9a8570]">
              {t("noResults", { query })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
