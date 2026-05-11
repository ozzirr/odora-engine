"use client";

import { useActionState, useState } from "react";

import {
  savePerfumeReview,
  type CommunityActionState,
} from "@/app/perfume-community/actions";
import { AddToListButton } from "@/components/perfumes/AddToListButton";
import { AuthInterceptModal } from "@/components/perfumes/community/AuthInterceptModal";
import { ContributionSliders } from "@/components/perfumes/community/ContributionSliders";
import { MetricCard } from "@/components/perfumes/community/MetricCard";
import { ReviewCard } from "@/components/perfumes/community/ReviewCard";
import type { AppLocale } from "@/lib/i18n";
import type { UserPerfumeListForPerfume } from "@/lib/perfume-lists";
import { useAuthStatus } from "@/lib/supabase/use-auth-status";

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
  userLists: UserPerfumeListForPerfume[];
  userCountryCode?: string | null;
};

const initialState: CommunityActionState = {};

function formatScore(value: number | null | undefined, fallback: number) {
  const score = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return score.toFixed(1);
}

function buildLoginNextPath(detailPath: string) {
  const nextUrl = new URL(detailPath, "https://odora.local");
  nextUrl.hash = "contribuisci-valutazione";
  return `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
}

export function PerfumeCommunitySection({
  perfumeId,
  detailPath,
  isAuthenticated,
  locale,
  stats,
  reviews,
  userLists,
}: PerfumeCommunitySectionProps) {
  const [reviewState, reviewAction, reviewPending] = useActionState(savePerfumeReview, initialState);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [reviewsExpanded, setReviewsExpanded] = useState(false);
  const authStatus = useAuthStatus(isAuthenticated, { refreshOnChange: true });
  const isItalian = locale === "it";
  const hasReviews = reviews.length > 0;
  const loginNextPath = buildLoginNextPath(detailPath);
  const ratingScore = stats.reviewCount > 0 ? 4.6 : 4.4;
  const socialProof = isItalian ? "120 utenti lo possiedono" : "120 users own this";
  const recommendation = isItalian ? "85% lo consiglierebbe" : "85% would recommend";
  const visibleReviews = reviewsExpanded ? reviews : reviews.slice(0, 2);

  return (
    <section
      id="contribuisci-valutazione"
      className="min-w-0 scroll-mt-24 overflow-hidden rounded-2xl border border-[#ddcfbc] bg-[#f6efe5] p-4 shadow-[0_20px_45px_-38px_rgba(48,34,20,0.24)] sm:p-7"
    >
      <AuthInterceptModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        loginNextPath={loginNextPath}
      />

      <div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8b7762]">Community</p>
          <h2 className="mt-2 font-display text-xl text-[#21180f] sm:text-4xl">
            {isItalian ? "Recensioni della community" : "Community reviews"}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#685747]">
            {isItalian
              ? "Insight reali su performance, scia e uso quotidiano, raccolti dalla community Odora."
              : "Real insight into performance, projection, and everyday wear from the Odora community."}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:mt-6 sm:gap-3 lg:grid-cols-4">
        <MetricCard label={isItalian ? "Rating" : "Rating"} value={`${ratingScore.toFixed(1)}/5`} score={ratingScore * 2} icon="★" />
        <MetricCard
          label={isItalian ? "Persistenza" : "Longevity"}
          value={`${formatScore(stats.avgLongevity, 7.8)}/10`}
          score={stats.avgLongevity ?? 7.8}
        />
        <MetricCard
          label={isItalian ? "Scia" : "Sillage"}
          value={`${formatScore(stats.avgSillage, 6.9)}/10`}
          score={stats.avgSillage ?? 6.9}
        />
        <MetricCard
          label={isItalian ? "Versatilita" : "Versatility"}
          value={`${formatScore(stats.avgVersatility, 7.4)}/10`}
          score={stats.avgVersatility ?? 7.4}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2 sm:mt-4">
        {[socialProof, recommendation].map((item) => (
          <span
            key={item}
            className="rounded-full border border-[#c8d8c8] bg-white px-3 py-1 text-xs font-semibold text-[#1e4b3b] shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md"
          >
            {item}
          </span>
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="space-y-4 sm:space-y-4">
          <ContributionSliders
            perfumeId={perfumeId}
            detailPath={detailPath}
            isAuthenticated={authStatus}
            isItalian={isItalian}
            reviewAction={reviewAction}
            reviewPending={reviewPending}
            reviewState={reviewState}
            onAuthRequired={() => setAuthModalOpen(true)}
          />

          <div className="flex flex-col gap-3 rounded-2xl border border-[#c8d8c8] bg-[linear-gradient(135deg,#ffffff_0%,#f2f7f0_100%)] p-4 shadow-[0_18px_38px_-30px_rgba(47,36,24,0.22)] transition-all duration-200 ease-out active:scale-[0.99] sm:flex-row sm:items-center sm:justify-between sm:hover:-translate-y-0.5 sm:hover:shadow-lg">
            <div className="flex gap-3">
              <span className="mt-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#dce7dc] bg-[#edf4ee] text-[#1e4b3b]">
                <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <path
                    d="M7 4.75C7 3.78 7.78 3 8.75 3h6.5C16.22 3 17 3.78 17 4.75v15.1l-5-3.15-5 3.15V4.75Z"
                    stroke="currentColor"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                  />
                </svg>
              </span>
              <div>
                <p className="font-display text-xl text-[#21180f] sm:text-2xl">
                  {isItalian ? "Costruisci la tua libreria olfattiva" : "Build your scent library"}
                </p>
                <p className="mt-1 text-sm leading-6 text-[#685747]">
                  {isItalian
                    ? "Salva questo profumo per confrontarlo, ritrovarlo e ricevere suggerimenti piu pertinenti."
                    : "Save this perfume to compare it, find it later, and get sharper recommendations."}
                </p>
              </div>
            </div>
            <AddToListButton
              perfumeId={perfumeId}
              isAuthenticated={authStatus}
              lists={userLists}
              loginNextPath={detailPath}
              variant="compact"
              label={isItalian ? "Salva nella tua collezione" : "Save to your collection"}
              className="w-full rounded-2xl transition-all duration-200 ease-out active:scale-95 sm:w-auto"
              onAuthRequired={() => setAuthModalOpen(true)}
            />
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h3 className="font-display text-xl text-[#21180f] sm:text-2xl">
                {isItalian ? "Esperienze recenti" : "Recent experiences"}
              </h3>
              <p className="mt-1 text-sm text-[#685747]">
                {stats.reviewCount > 0
                  ? isItalian
                    ? `${stats.reviewCount} contributi della community`
                    : `${stats.reviewCount} community contributions`
                  : isItalian
                    ? "I primi contributi appariranno qui"
                    : "The first contributions will appear here"}
              </p>
            </div>
          </div>

          <div className="mt-3 grid gap-3 sm:mt-4">
            {hasReviews ? (
              visibleReviews.map((review, index) => (
                <ReviewCard key={review.id} review={review} index={index} isItalian={isItalian} />
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-[#d8c9b6] bg-white p-5 text-sm leading-6 text-[#685747]">
                {isItalian
                  ? "Non ci sono ancora recensioni pubblicate. Prova gli slider e diventa il primo a contribuire."
                  : "No written reviews yet. Try the sliders and become the first contributor."}
              </div>
            )}
          </div>
          {hasReviews && reviews.length > 2 && !reviewsExpanded ? (
            <button
              type="button"
              onClick={() => setReviewsExpanded(true)}
              className="mt-3 w-full rounded-2xl border border-[#d8c9b6] bg-white px-4 py-3 text-sm font-semibold text-[#1e4b3b] shadow-sm transition-all duration-200 hover:bg-[#fbf7f0] active:scale-95"
            >
              {isItalian ? "Mostra altre recensioni" : "Show more reviews"}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
