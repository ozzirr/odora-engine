"use client";

import { useActionState } from "react";

import {
  savePerfumePurchasePrice,
  savePerfumeReview,
  type CommunityActionState,
} from "@/app/perfume-community/actions";
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
  loginHref: string;
  locale: AppLocale;
  stats: CommunityStats;
  reviews: CommunityReview[];
  userCountryCode?: string | null;
  mode?: "summary" | "contribute";
};

const initialState: CommunityActionState = {};

export function PerfumeCommunitySection({
  perfumeId,
  detailPath,
  isAuthenticated,
  loginHref,
  locale,
  reviews,
  userCountryCode,
  mode = "summary",
}: PerfumeCommunitySectionProps) {
  const [reviewState, reviewAction, reviewPending] = useActionState(savePerfumeReview, initialState);
  const [priceState, priceAction, pricePending] = useActionState(savePerfumePurchasePrice, initialState);

  if (mode === "summary") {
    const isItalian = locale === "it";
    const highlightedReviews = reviews.slice(0, 2);
    const hasReviews = highlightedReviews.length > 0;

    return (
      <section className="rounded-3xl border border-[#ddcfbc] bg-[#fffdf9] p-5 shadow-[0_20px_45px_-38px_rgba(48,34,20,0.24)] sm:p-7">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8b7762]">Community</p>
            <h2 className="mt-2 font-display text-3xl text-[#21180f] sm:text-4xl">
              {isItalian ? "Recensioni della community" : "Community reviews"}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#685747]">
              {hasReviews
                ? isItalian
                  ? "Esperienze reali condivise dagli utenti Odora."
                  : "Real experiences shared by Odora users."
                : isItalian
                  ? "Le recensioni appariranno qui quando gli utenti inizieranno a valutare questo profumo."
                  : "Reviews will appear here once users start rating this perfume."}
            </p>

            {!hasReviews ? (
              <a
                href="#contribuisci-valutazione"
                className={buttonStyles({ variant: "secondary", className: "mt-5 w-full sm:w-auto" })}
              >
                {isItalian ? "Scrivi la prima recensione" : "Write the first review"}
              </a>
            ) : null}
          </div>

          <div>
            <h3 className="font-display text-2xl text-[#21180f]">
              {isItalian ? "Recensioni in evidenza" : "Highlighted reviews"}
            </h3>
            <div className="mt-4 space-y-3">
              {!hasReviews ? (
                <p className="rounded-[1.25rem] border border-dashed border-[#d8c9b6] bg-[#fbf7f0] p-4 text-sm leading-6 text-[#685747]">
                  {isItalian
                    ? "Le recensioni testuali appariranno qui appena la community le pubblica."
                    : "Written reviews will appear here as soon as the community publishes them."}
                </p>
              ) : (
                highlightedReviews.map((review) => (
                  <article key={review.id} className="rounded-[1.25rem] border border-[#eadfce] bg-white p-4 shadow-[0_16px_34px_-32px_rgba(53,39,27,0.26)]">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#e9dece] text-sm font-semibold text-[#6f5a45]">
                        {(review.user.name ?? "O").slice(0, 1).toUpperCase()}
                      </span>
                      <div>
                        <p className="font-semibold text-[#21180f]">{review.user.name ?? "Utente Odora"}</p>
                        <p className="text-xs text-[#8b7762]">
                          {isItalian ? "Esperienza verificata dalla community" : "Community-verified experience"}
                        </p>
                      </div>
                    </div>
                    {review.text ? <p className="mt-3 text-sm leading-6 text-[#685747]">{review.text}</p> : null}
                  </article>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="contribuisci-valutazione" className="scroll-mt-24 rounded-3xl border border-[#ddcfbc] bg-[#fffdf9] p-5 shadow-[0_20px_45px_-38px_rgba(48,34,20,0.24)] sm:p-7">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8b7762]">Community</p>
      <h2 className="mt-2 font-display text-3xl text-[#21180f] sm:text-4xl">Contribuisci a questo profumo</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#685747]">
        Aggiungi una recensione guidata o il prezzo a cui lo hai acquistato.
      </p>

      {!isAuthenticated ? (
        <div className="mt-6 rounded-2xl border border-[#eadfce] bg-[#fbf7f0] p-4 text-sm text-[#685747]">
          Accedi per scrivere una recensione guidata o aggiungere quanto hai pagato questo profumo.
          <a href={loginHref} className={buttonStyles({ className: "mt-4 w-full sm:w-auto" })}>
            Accedi
          </a>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <form action={reviewAction} className="rounded-2xl border border-[#eadfce] bg-white p-4">
            <input type="hidden" name="perfumeId" value={perfumeId} />
            <input type="hidden" name="detailPath" value={detailPath} />
            <h3 className="font-display text-2xl text-[#21180f]">Scrivi una recensione</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <ScoreInput name="longevityScore" label="Persistenza" />
              <ScoreInput name="sillageScore" label="Scia" />
              <ScoreInput name="versatilityScore" label="Versatilita" />
            </div>
            <textarea
              name="text"
              rows={3}
              maxLength={500}
              placeholder="Due righe opzionali sulla tua esperienza"
              className="mt-3 w-full rounded-xl border border-[#ddcfbe] bg-white px-3 py-2 text-sm outline-none"
            />
            {reviewState.error ? <p className="mt-2 text-sm text-[#7c3f35]">{reviewState.error}</p> : null}
            {reviewState.message ? <p className="mt-2 text-sm text-[#4d6340]">{reviewState.message}</p> : null}
            <button type="submit" disabled={reviewPending} className={buttonStyles({ className: "mt-3 w-full" })}>
              {reviewPending ? "Salvataggio..." : "Salva recensione"}
            </button>
          </form>

          <form action={priceAction} className="rounded-2xl border border-[#eadfce] bg-white p-4">
            <input type="hidden" name="perfumeId" value={perfumeId} />
            <input type="hidden" name="detailPath" value={detailPath} />
            <h3 className="font-display text-2xl text-[#21180f]">Quanto lo hai pagato?</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_90px]">
              <input
                name="priceAmount"
                inputMode="decimal"
                required
                placeholder="195,00"
                className="h-11 rounded-xl border border-[#ddcfbe] bg-white px-3 text-sm outline-none"
              />
              <select name="currency" defaultValue="EUR" className="h-11 rounded-xl border border-[#ddcfbe] bg-white px-3 text-sm outline-none">
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
            <button type="submit" disabled={pricePending} className={buttonStyles({ className: "mt-3 w-full" })}>
              {pricePending ? "Salvataggio..." : "Aggiungi prezzo"}
            </button>
          </form>
        </div>
      )}
    </section>
  );
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
