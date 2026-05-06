"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import {
  savePerfumePurchasePrice,
  savePerfumeReview,
  type CommunityActionState,
} from "@/app/perfume-community/actions";
import { AuthModalTrigger } from "@/components/auth/AuthModalTrigger";
import { buttonStyles } from "@/components/ui/Button";
import type { AppLocale } from "@/lib/i18n";

type CommunityReview = {
  id: number;
  longevityScore: number;
  sillageScore: number;
  versatilityScore: number;
  text: string | null;
  createdAt: Date | string;
  user: {
    name: string | null;
    countryCode: string | null;
  };
};

type CommunityStats = {
  reviewCount: number;
  avgLongevity: number | null;
  avgSillage: number | null;
  avgVersatility: number | null;
  priceCount: number;
  avgPrice: number | null;
  currency: string;
};

type PerfumeCommunitySectionProps = {
  perfumeId: number;
  detailPath: string;
  isAuthenticated: boolean;
  locale: AppLocale;
  stats: CommunityStats;
  reviews: CommunityReview[];
  userCountryCode?: string | null;
};

type ContributionPanel = "review" | "price" | null;

const initialState: CommunityActionState = {};
const REVIEW_INTENT = "review";
const PRICE_INTENT = "price";
const AUTH_INTENT_PARAM = "authIntent";

function buildContributionNextPath(detailPath: string, intent: "review" | "price") {
  const nextUrl = new URL(detailPath, "https://odora.local");
  nextUrl.searchParams.set(AUTH_INTENT_PARAM, intent);
  nextUrl.hash = "contribuisci-valutazione";
  return `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
}

function ScoreInput({ name, label }: { name: string; label: string }) {
  return (
    <label className="space-y-1.5">
      <span className="text-xs font-medium text-[#3a2e24]">{label}</span>
      <input
        name={name}
        type="number"
        min={1}
        max={10}
        required
        defaultValue={7}
        className="h-11 w-full rounded-xl border border-[#ddcfbe] bg-white px-3 text-sm outline-none"
      />
    </label>
  );
}

function ReviewForm({
  perfumeId,
  detailPath,
  reviewAction,
  reviewPending,
  reviewState,
}: {
  perfumeId: number;
  detailPath: string;
  reviewAction: (formData: FormData) => void;
  reviewPending: boolean;
  reviewState: CommunityActionState;
}) {
  return (
    <form action={reviewAction} className="rounded-[1.35rem] border border-[#eadfce] bg-white p-4 shadow-[0_18px_36px_-30px_rgba(53,39,27,0.2)] sm:p-5">
      <input type="hidden" name="perfumeId" value={perfumeId} />
      <input type="hidden" name="detailPath" value={detailPath} />
      <h3 className="font-display text-2xl text-[#21180f]">Scrivi una recensione</h3>
      <p className="mt-2 text-sm leading-6 text-[#685747]">
        Lascia un voto rapido su persistenza, scia e versatilita, con due righe opzionali sulla tua esperienza.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <ScoreInput name="longevityScore" label="Persistenza" />
        <ScoreInput name="sillageScore" label="Scia" />
        <ScoreInput name="versatilityScore" label="Versatilita" />
      </div>
      <textarea
        name="text"
        rows={4}
        maxLength={500}
        placeholder="Due righe opzionali sulla tua esperienza"
        className="mt-3 w-full rounded-xl border border-[#ddcfbe] bg-white px-3 py-2 text-sm outline-none"
      />
      {reviewState.error ? <p className="mt-2 text-sm text-[#7c3f35]">{reviewState.error}</p> : null}
      {reviewState.message ? <p className="mt-2 text-sm text-[#4d6340]">{reviewState.message}</p> : null}
      <button type="submit" disabled={reviewPending} className={buttonStyles({ className: "mt-4 w-full sm:w-auto" })}>
        {reviewPending ? "Salvataggio..." : "Salva recensione"}
      </button>
    </form>
  );
}

function PriceForm({
  perfumeId,
  detailPath,
  userCountryCode,
  priceAction,
  pricePending,
  priceState,
}: {
  perfumeId: number;
  detailPath: string;
  userCountryCode?: string | null;
  priceAction: (formData: FormData) => void;
  pricePending: boolean;
  priceState: CommunityActionState;
}) {
  return (
    <form action={priceAction} className="rounded-[1.35rem] border border-[#eadfce] bg-white p-4 shadow-[0_18px_36px_-30px_rgba(53,39,27,0.2)] sm:p-5">
      <input type="hidden" name="perfumeId" value={perfumeId} />
      <input type="hidden" name="detailPath" value={detailPath} />
      <h3 className="font-display text-2xl text-[#21180f]">Aggiungi il prezzo pagato</h3>
      <p className="mt-2 text-sm leading-6 text-[#685747]">
        Condividi quanto lo hai pagato e dove, cosi la pagina diventa piu utile anche sul lato prezzo reale.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_96px]">
        <input
          name="priceAmount"
          inputMode="decimal"
          required
          placeholder="195,00"
          className="h-11 rounded-xl border border-[#ddcfbe] bg-white px-3 text-sm outline-none"
        />
        <select
          name="currency"
          defaultValue="EUR"
          className="h-11 rounded-xl border border-[#ddcfbe] bg-white px-3 text-sm outline-none"
        >
          <option value="EUR">EUR</option>
          <option value="USD">USD</option>
          <option value="GBP">GBP</option>
        </select>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <input
          name="countryCode"
          defaultValue={userCountryCode ?? ""}
          placeholder="Paese, es. IT"
          maxLength={2}
          className="h-11 rounded-xl border border-[#ddcfbe] bg-white px-3 text-sm uppercase outline-none"
        />
        <input
          name="storeName"
          placeholder="Store opzionale"
          className="h-11 rounded-xl border border-[#ddcfbe] bg-white px-3 text-sm outline-none"
        />
      </div>
      <input
        name="purchaseDate"
        type="date"
        className="mt-3 h-11 w-full rounded-xl border border-[#ddcfbe] bg-white px-3 text-sm outline-none"
      />
      {priceState.error ? <p className="mt-2 text-sm text-[#7c3f35]">{priceState.error}</p> : null}
      {priceState.message ? <p className="mt-2 text-sm text-[#4d6340]">{priceState.message}</p> : null}
      <button type="submit" disabled={pricePending} className={buttonStyles({ className: "mt-4 w-full sm:w-auto" })}>
        {pricePending ? "Salvataggio..." : "Aggiungi prezzo"}
      </button>
    </form>
  );
}

function CommunityStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-[1rem] border border-[#e6d8c6] bg-[#fcf8f1] px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8b7762]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#21180f]">{value}</p>
    </div>
  );
}

function ReviewCarousel({
  reviews,
  isItalian,
}: {
  reviews: CommunityReview[];
  isItalian: boolean;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const userPausedRef = useRef(false);
  const hasMultipleReviews = reviews.length > 1;
  const visibleIndex = reviews.length > 0 ? activeIndex % reviews.length : 0;

  useEffect(() => {
    if (!hasMultipleReviews || isPaused) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % reviews.length);
    }, 4200);

    return () => window.clearInterval(intervalId);
  }, [hasMultipleReviews, isPaused, reviews.length]);

  const pauseForIntent = () => {
    userPausedRef.current = true;
    setIsPaused(true);
  };

  const pauseTemporarily = () => {
    setIsPaused(true);
  };

  const resumeIfNoIntent = () => {
    if (!userPausedRef.current) {
      setIsPaused(false);
    }
  };

  const goToReview = (nextIndex: number) => {
    pauseForIntent();
    setActiveIndex((nextIndex + reviews.length) % reviews.length);
  };

  return (
    <div
      className="relative w-full min-w-0 overflow-hidden rounded-[1.25rem] border border-[#eadfce] bg-[#fbf7f0] p-2 sm:rounded-[1.45rem] sm:p-3"
      onPointerDown={pauseForIntent}
      onMouseEnter={pauseTemporarily}
      onMouseLeave={resumeIfNoIntent}
      onFocus={pauseForIntent}
    >
      <div
        className="flex transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ transform: `translateX(-${visibleIndex * 100}%)` }}
      >
        {reviews.map((review) => (
          <article key={review.id} className="min-w-0 max-w-full shrink-0 basis-full">
            <div className="flex min-h-[13rem] flex-col rounded-[1.1rem] border border-[#eadfce] bg-white p-4 shadow-[0_16px_34px_-32px_rgba(53,39,27,0.26)] sm:min-h-[15rem] sm:rounded-[1.25rem] sm:p-5">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e9dece] text-sm font-semibold text-[#6f5a45]">
                  {(review.user.name ?? "O").slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-[#21180f]">{review.user.name ?? "Utente Odora"}</p>
                  <p className="text-xs text-[#8b7762]">
                    {isItalian ? "Esperienza verificata dalla community" : "Community-verified experience"}
                  </p>
                </div>
              </div>
              {review.text ? (
                <div className="relative mt-4 min-h-0 flex-1 overflow-hidden">
                  <p className="line-clamp-[8] break-words text-sm leading-6 text-[#685747] sm:line-clamp-none">
                    {review.text}
                  </p>
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent sm:hidden" />
                </div>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      {hasMultipleReviews ? (
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap gap-1.5">
            {reviews.map((review, index) => (
              <button
                key={review.id}
                type="button"
                aria-label={
                  isItalian
                    ? `Mostra recensione ${index + 1} di ${reviews.length}`
                    : `Show review ${index + 1} of ${reviews.length}`
                }
                onClick={() => goToReview(index)}
                className={[
                  "h-2.5 rounded-full transition-all",
                  visibleIndex === index ? "w-7 bg-[#214f3e]" : "w-2.5 bg-[#d8c9b6] hover:bg-[#bca88f]",
                ].join(" ")}
              />
            ))}
          </div>

          <div className="hidden shrink-0 items-center gap-2 sm:flex">
            <button
              type="button"
              onClick={() => goToReview(visibleIndex - 1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#dfcfbc] bg-white text-[#4d3c2f] transition hover:border-[#bca88f]"
              aria-label={isItalian ? "Recensione precedente" : "Previous review"}
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => goToReview(visibleIndex + 1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#dfcfbc] bg-white text-[#4d3c2f] transition hover:border-[#bca88f]"
              aria-label={isItalian ? "Recensione successiva" : "Next review"}
            >
              ›
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function PerfumeCommunitySection({
  perfumeId,
  detailPath,
  isAuthenticated,
  locale,
  stats,
  reviews,
  userCountryCode,
}: PerfumeCommunitySectionProps) {
  const [reviewState, reviewAction, reviewPending] = useActionState(savePerfumeReview, initialState);
  const [priceState, priceAction, pricePending] = useActionState(savePerfumePurchasePrice, initialState);
  const [expandedPanel, setExpandedPanel] = useState<ContributionPanel>(null);
  const isItalian = locale === "it";
  const searchParams = useSearchParams();
  const hasReviews = reviews.length > 0;
  const reviewCountLabel =
    stats.reviewCount > 0
      ? isItalian
        ? `${stats.reviewCount} recensioni`
        : `${stats.reviewCount} reviews`
      : isItalian
        ? "Ancora nessuna recensione"
        : "No reviews yet";
  const averagePriceLabel =
    typeof stats.avgPrice === "number"
      ? new Intl.NumberFormat(isItalian ? "it-IT" : "en-US", {
          style: "currency",
          currency: stats.currency || "EUR",
          maximumFractionDigits: 0,
        }).format(stats.avgPrice)
      : isItalian
        ? "Prezzi in arrivo"
        : "Price data coming";

  useEffect(() => {
    const syncExpandedState = () => {
      if (typeof window === "undefined") {
        return;
      }

      const authIntent = searchParams.get(AUTH_INTENT_PARAM);
      if (window.location.hash === "#contribuisci-valutazione" || authIntent === REVIEW_INTENT) {
        setExpandedPanel("review");
      } else if (authIntent === PRICE_INTENT) {
        setExpandedPanel("price");
      }
    };

    syncExpandedState();
    window.addEventListener("hashchange", syncExpandedState);
    return () => window.removeEventListener("hashchange", syncExpandedState);
  }, [searchParams]);

  const contributionPanel = expandedPanel ? (
    <div className="mb-7 border-b border-[#eadfce] pb-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-full border border-[#e2d6c8] bg-[#fcf8f1] p-1">
          <button
            type="button"
            onClick={() => setExpandedPanel("review")}
            className={[
              "rounded-full px-4 py-2 text-sm font-semibold transition",
              expandedPanel === "review" ? "bg-[#1e4b3b] text-white" : "text-[#685747]",
            ].join(" ")}
          >
            {isItalian ? "Recensione" : "Review"}
          </button>
          <button
            type="button"
            onClick={() => setExpandedPanel("price")}
            className={[
              "rounded-full px-4 py-2 text-sm font-semibold transition",
              expandedPanel === "price" ? "bg-[#1e4b3b] text-white" : "text-[#685747]",
            ].join(" ")}
          >
            {isItalian ? "Prezzo pagato" : "Price paid"}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setExpandedPanel(null)}
          className="text-sm font-semibold text-[#6b5847] transition hover:text-[#21180f]"
        >
          {isItalian ? "Chiudi" : "Close"}
        </button>
      </div>

      {!isAuthenticated ? (
        <div className="mt-4 rounded-[1.35rem] border border-[#eadfce] bg-[#fbf7f0] p-4 text-sm leading-6 text-[#685747] sm:p-5">
          {expandedPanel === "review"
            ? isItalian
              ? "Accedi per lasciare una recensione guidata su questo profumo."
              : "Log in to leave a guided review for this perfume."
            : isItalian
              ? "Accedi per aggiungere il prezzo che hai pagato per questo profumo."
              : "Log in to add the price you paid for this perfume."}
          <AuthModalTrigger
            mode="login"
            resolveNextPath={() => buildContributionNextPath(detailPath, expandedPanel === "price" ? "price" : "review")}
            className={buttonStyles({ className: "mt-4 w-full sm:w-auto" })}
          >
            {isItalian ? "Accedi" : "Log in"}
          </AuthModalTrigger>
        </div>
      ) : expandedPanel === "review" ? (
        <div className="mt-4">
          <ReviewForm
            perfumeId={perfumeId}
            detailPath={detailPath}
            reviewAction={reviewAction}
            reviewPending={reviewPending}
            reviewState={reviewState}
          />
        </div>
      ) : (
        <div className="mt-4">
          <PriceForm
            perfumeId={perfumeId}
            detailPath={detailPath}
            userCountryCode={userCountryCode}
            priceAction={priceAction}
            pricePending={pricePending}
            priceState={priceState}
          />
        </div>
      )}
    </div>
  ) : null;

  return (
    <section
      id="contribuisci-valutazione"
      className="min-w-0 scroll-mt-24 overflow-hidden rounded-3xl border border-[#ddcfbc] bg-[#fffdf9] p-4 shadow-[0_20px_45px_-38px_rgba(48,34,20,0.24)] sm:p-7"
    >
      <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] lg:items-start">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8b7762]">Community</p>
          <h2 className="mt-2 font-display text-3xl text-[#21180f] sm:text-4xl">
            {isItalian ? "Recensioni della community" : "Community reviews"}
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#685747]">
            {hasReviews
              ? isItalian
                ? "Pareri reali, note sull'uso e impressioni condivise dagli utenti Odora."
                : "Real opinions, wear notes, and impressions shared by Odora users."
              : isItalian
                ? "Non ci sono ancora recensioni pubblicate. Puoi essere il primo a lasciare un parere o aggiungere il prezzo che hai pagato."
                : "There are no published reviews yet. You can be the first to leave a review or add the price you paid."}
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <CommunityStat label={isItalian ? "Recensioni" : "Reviews"} value={reviewCountLabel} />
            <CommunityStat label={isItalian ? "Prezzo medio community" : "Community average price"} value={averagePriceLabel} />
          </div>

          <div className="mt-5 grid gap-3 sm:flex sm:flex-wrap">
            <button
              type="button"
              onClick={() => setExpandedPanel("review")}
              className={buttonStyles({ variant: hasReviews ? "secondary" : "primary", className: "w-full justify-center sm:w-auto" })}
            >
              {hasReviews
                ? isItalian
                  ? "Scrivi la tua recensione"
                  : "Write your review"
                : isItalian
                  ? "Scrivi la prima recensione"
                  : "Write the first review"}
            </button>
            <button
              type="button"
              onClick={() => setExpandedPanel("price")}
              className={buttonStyles({ variant: "ghost", className: "w-full justify-center sm:w-auto" })}
            >
              {isItalian ? "Aggiungi il prezzo" : "Add your price"}
            </button>
          </div>
        </div>

        <div className="min-w-0">
          {contributionPanel}

          <h3 className="font-display text-2xl text-[#21180f]">
            {isItalian ? "Recensioni in evidenza" : "Highlighted reviews"}
          </h3>
          <div className="mt-4">
            {!hasReviews ? (
              <p className="rounded-[1.25rem] border border-dashed border-[#d8c9b6] bg-[#fbf7f0] p-4 text-sm leading-6 text-[#685747]">
                {isItalian
                  ? "Le recensioni testuali compariranno qui appena la community inizia a pubblicarle."
                  : "Written reviews will appear here as soon as the community starts publishing them."}
              </p>
            ) : (
              <ReviewCarousel reviews={reviews} isItalian={isItalian} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
