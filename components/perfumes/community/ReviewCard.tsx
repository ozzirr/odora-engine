"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

type ReviewCardProps = {
  review: {
    id: number;
    longevityScore: number;
    sillageScore: number;
    versatilityScore: number;
    text: string | null;
    user: {
      name: string | null;
      countryCode: string | null;
    };
  };
  index: number;
  isItalian: boolean;
};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part.trim().slice(0, 1))
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  const safeValue = Math.min(10, Math.max(0, Math.round(value)));

  return (
    <div className="rounded-xl border border-[#e4d8c8] bg-[#fffdf9]/78 px-2.5 py-2 text-center shadow-[0_12px_28px_-26px_rgba(53,39,27,0.32)]">
      <p className="truncate text-[9px] font-semibold uppercase leading-none tracking-[0.1em] text-[#8a7763]">
        {label}
      </p>
      <p className="mt-1 text-base font-semibold leading-none text-[#1f1914]">
        {safeValue}
        <span className="ml-1 text-[12px] font-medium text-[#6f5d4b]">/10</span>
      </p>
    </div>
  );
}

export function ReviewCard({ review, index, isItalian }: ReviewCardProps) {
  const [expanded, setExpanded] = useState(false);
  const username = review.user.name ?? (isItalian ? "Utente Odora" : "Odora member");
  const badge = index === 0 ? "Verified" : index === 1 ? "Top reviewer" : null;
  const text =
    review.text ||
    (isItalian
      ? "Una valutazione rapida della community su performance e uso quotidiano."
      : "A quick community rating on performance and everyday wear.");
  const shouldTruncate = text.length > 170;

  return (
    <article className="rounded-2xl border border-[#eadfce] bg-white p-3 shadow-[0_18px_38px_-32px_rgba(53,39,27,0.3)] transition-all duration-200 ease-out active:scale-[0.99] sm:p-5 sm:hover:-translate-y-1 sm:hover:border-[#d8c9b6] sm:hover:shadow-md">
      <header className="flex items-start gap-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e9dece] text-xs font-semibold text-[#6f5a45] sm:h-11 sm:w-11 sm:text-sm">
          {initials(username) || "O"}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-base font-semibold text-[#21180f] sm:text-lg">{username}</p>
            {badge ? (
              <span className="rounded-full border border-[#d7e4d8] bg-white px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#56745c]">
                {badge}
              </span>
            ) : null}
          </div>
          <p className="text-xs text-[#8b7762]">
            {isItalian ? "Esperienza condivisa dalla community" : "Shared community experience"}
          </p>
        </div>
      </header>

      <div className="mt-3 sm:mt-4">
        <p className={cn("break-words text-sm leading-6 text-[#685747]", !expanded && "line-clamp-3")}>{text}</p>
        {shouldTruncate ? (
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            className="mt-2 text-sm font-semibold text-[#1e4b3b] transition-all duration-200 hover:text-[#16382c]"
          >
            {expanded ? (isItalian ? "Mostra meno" : "Show less") : isItalian ? "Leggi tutto" : "Read more"}
          </button>
        ) : null}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 sm:mt-4 sm:gap-3">
        <MiniMetric label={isItalian ? "Persistenza" : "Longevity"} value={review.longevityScore} />
        <MiniMetric label={isItalian ? "Scia" : "Sillage"} value={review.sillageScore} />
        <MiniMetric label={isItalian ? "Versatilita" : "Versatility"} value={review.versatilityScore} />
      </div>
    </article>
  );
}
