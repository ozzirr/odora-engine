"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CatalogGate } from "@/components/catalog/CatalogGate";
import { PerfumeGrid } from "@/components/perfumes/PerfumeGrid";
import { Button } from "@/components/ui/Button";
import {
  defaultFinderPreferences,
  type FinderPerfume,
  type FinderPreferences,
  matchPerfumesFromPreferences,
} from "@/lib/finder";
import { useAuthStatus } from "@/lib/supabase/use-auth-status";

type FinderExperienceProps = {
  perfumes: FinderPerfume[];
  isAuthenticated: boolean;
  initialPreferences: FinderPreferences;
  presetLabel?: string | null;
};

function toLabel(slug: string) {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function withSelectedOption(options: string[], selectedValue: string) {
  if (!selectedValue || options.includes(selectedValue)) {
    return options;
  }

  return [selectedValue, ...options];
}

function hasConfiguredPreferences(preferences: FinderPreferences) {
  return (
    preferences.gender !== defaultFinderPreferences.gender ||
    preferences.mood !== defaultFinderPreferences.mood ||
    preferences.season !== defaultFinderPreferences.season ||
    preferences.occasion !== defaultFinderPreferences.occasion ||
    preferences.budget !== defaultFinderPreferences.budget ||
    preferences.preferredNote !== defaultFinderPreferences.preferredNote ||
    preferences.arabicOnly !== defaultFinderPreferences.arabicOnly ||
    preferences.nicheOnly !== defaultFinderPreferences.nicheOnly
  );
}

const FINDER_RESULTS_PAGE_SIZE = 20;
const FREE_FINDER_PREVIEW_LIMIT = 25;

export function FinderExperience({
  perfumes,
  isAuthenticated,
  initialPreferences,
  presetLabel,
}: FinderExperienceProps) {
  const authStatus = useAuthStatus(isAuthenticated);
  const [preferences, setPreferences] = useState<FinderPreferences>(initialPreferences);
  const [results, setResults] = useState<FinderPerfume[]>([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [visibleCount, setVisibleCount] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const isAutoLoadingRef = useRef(false);
  const hasAutoRunRef = useRef(false);

  const moodOptions = useMemo(
    () =>
      withSelectedOption(
        Array.from(
        new Set(
          perfumes.flatMap((perfume) =>
            (perfume.moods ?? []).map((mood) => mood.mood?.slug).filter((slug): slug is string => Boolean(slug)),
          ),
        ),
        ).sort(),
        preferences.mood,
      ),
    [perfumes, preferences.mood],
  );

  const seasonOptions = useMemo(
    () =>
      withSelectedOption(
        Array.from(
        new Set(
          perfumes.flatMap((perfume) =>
            (perfume.seasons ?? [])
              .map((season) => season.season?.slug)
              .filter((slug): slug is string => Boolean(slug)),
          ),
        ),
        ).sort(),
        preferences.season,
      ),
    [perfumes, preferences.season],
  );

  const occasionOptions = useMemo(
    () =>
      withSelectedOption(
        Array.from(
          new Set(
            perfumes.flatMap((perfume) =>
              (perfume.occasions ?? [])
                .map((occasion) => occasion.occasion?.slug)
                .filter((slug): slug is string => Boolean(slug)),
            ),
          ),
        ).sort(),
        preferences.occasion,
      ),
    [perfumes, preferences.occasion],
  );

  const noteOptions = useMemo(() => {
    const counts = new Map<string, number>();

    for (const perfume of perfumes) {
      for (const note of perfume.notes ?? []) {
        const key = note.note?.slug;
        if (!key) {
          continue;
        }
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }

    const rankedNotes = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([slug]) => slug)
      .slice(0, 14);

    return withSelectedOption(rankedNotes, preferences.preferredNote);
  }, [perfumes, preferences.preferredNote]);

  const presetChips = useMemo(() => {
    const chips: string[] = [];

    if (preferences.mood) chips.push(`Mood: ${toLabel(preferences.mood)}`);
    if (preferences.season) chips.push(`Season: ${toLabel(preferences.season)}`);
    if (preferences.occasion) chips.push(`Occasion: ${toLabel(preferences.occasion)}`);
    if (preferences.preferredNote) chips.push(`Note: ${toLabel(preferences.preferredNote)}`);
    if (preferences.arabicOnly) chips.push("Arabic only");
    if (preferences.nicheOnly) chips.push("Niche only");

    return chips;
  }, [
    preferences.arabicOnly,
    preferences.mood,
    preferences.nicheOnly,
    preferences.occasion,
    preferences.preferredNote,
    preferences.season,
  ]);

  const runFinderSearch = useCallback(async (nextPreferences: FinderPreferences) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/finder", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(nextPreferences),
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Finder request failed with status ${response.status}`);
      }

      const payload = (await response.json()) as {
        results: FinderPerfume[];
        total: number;
      };
      const nextResults = payload.results ?? [];
      const maxVisible = authStatus
        ? nextResults.length
        : Math.min(nextResults.length, FREE_FINDER_PREVIEW_LIMIT);

      setResults(nextResults);
      setTotalMatches(payload.total ?? nextResults.length);
      setVisibleCount(Math.min(FINDER_RESULTS_PAGE_SIZE, maxVisible));
      setSubmitted(true);
    } catch {
      const fallbackResults = matchPerfumesFromPreferences(nextPreferences, perfumes);
      const maxVisible = authStatus
        ? fallbackResults.length
        : Math.min(fallbackResults.length, FREE_FINDER_PREVIEW_LIMIT);
      setResults(fallbackResults);
      setTotalMatches(fallbackResults.length);
      setVisibleCount(Math.min(FINDER_RESULTS_PAGE_SIZE, maxVisible));
      setSubmitted(true);
      setErrorMessage("Live matching is temporarily unavailable. Showing the closest catalog matches instead.");
    } finally {
      setIsLoading(false);
    }
  }, [authStatus, perfumes]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await runFinderSearch(preferences);
  };

  const resetForm = () => {
    setPreferences(defaultFinderPreferences);
    setResults([]);
    setTotalMatches(0);
    setVisibleCount(0);
    setSubmitted(false);
    setErrorMessage(null);
    setIsLoading(false);
  };

  useEffect(() => {
    if (hasAutoRunRef.current || !hasConfiguredPreferences(initialPreferences)) {
      return;
    }

    hasAutoRunRef.current = true;
    void runFinderSearch(initialPreferences);
  }, [initialPreferences, runFinderSearch]);

  const maxVisibleResults = authStatus
    ? results.length
    : Math.min(results.length, FREE_FINDER_PREVIEW_LIMIT);
  const displayedResults = results.slice(0, visibleCount);
  const hasMoreVisibleResults = displayedResults.length < maxVisibleResults;
  const isCatalogLocked = !authStatus && results.length > FREE_FINDER_PREVIEW_LIMIT && visibleCount >= FREE_FINDER_PREVIEW_LIMIT;
  const showPresetBanner = Boolean(presetLabel) && hasConfiguredPreferences(preferences);

  const loadMoreResults = useCallback(() => {
    if (isAutoLoadingRef.current || !hasMoreVisibleResults || isCatalogLocked) {
      return;
    }

    isAutoLoadingRef.current = true;
    setVisibleCount((current) =>
      Math.min(current + FINDER_RESULTS_PAGE_SIZE, maxVisibleResults),
    );
    queueMicrotask(() => {
      isAutoLoadingRef.current = false;
    });
  }, [hasMoreVisibleResults, isCatalogLocked, maxVisibleResults]);

  useEffect(() => {
    if (!submitted || !loadMoreRef.current || !hasMoreVisibleResults || isCatalogLocked) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadMoreResults();
        }
      },
      {
        rootMargin: "320px 0px",
      },
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMoreVisibleResults, isCatalogLocked, loadMoreResults, submitted]);

  return (
    <div className="space-y-8">
      {showPresetBanner ? (
        <div className="rounded-[1.75rem] border border-[#dfd1bf] bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(247,239,229,0.95))] p-5 shadow-[0_22px_46px_-36px_rgba(50,35,20,0.34)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a7763]">
            Finder preset
          </p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-3xl text-[#1f1914]">
                {presetLabel ? presetLabel : "Suggested starting point"}
              </h2>
              <p className="mt-1 text-sm text-[#635343]">
                These filters were pre-filled from the shortcut you selected on the homepage.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {presetChips.map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-[#dbcdb9] bg-white/75 px-3 py-1 text-xs text-[#5d4e3f]"
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-[#dfd1bf] bg-white p-6 shadow-[0_20px_45px_-38px_rgba(48,34,20,0.38)] sm:p-8"
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-[0.1em] text-[#7a6654]">
              Gender preference
            </label>
            <select
              value={preferences.gender}
              onChange={(event) =>
                setPreferences((prev) => ({
                  ...prev,
                  gender: event.target.value as FinderPreferences["gender"],
                }))
              }
              className="h-11 w-full rounded-xl border border-[#d8cab7] bg-[#fdfbf7] px-3 text-sm"
            >
              <option value="any">Any</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="unisex">Unisex</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-[0.1em] text-[#7a6654]">
              Preferred mood
            </label>
            <select
              value={preferences.mood}
              onChange={(event) => setPreferences((prev) => ({ ...prev, mood: event.target.value }))}
              className="h-11 w-full rounded-xl border border-[#d8cab7] bg-[#fdfbf7] px-3 text-sm"
            >
              <option value="">Any</option>
              {moodOptions.map((mood) => (
                <option key={mood} value={mood}>
                  {toLabel(mood)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-[0.1em] text-[#7a6654]">
              Season
            </label>
            <select
              value={preferences.season}
              onChange={(event) => setPreferences((prev) => ({ ...prev, season: event.target.value }))}
              className="h-11 w-full rounded-xl border border-[#d8cab7] bg-[#fdfbf7] px-3 text-sm"
            >
              <option value="">Any</option>
              {seasonOptions.map((season) => (
                <option key={season} value={season}>
                  {toLabel(season)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-[0.1em] text-[#7a6654]">
              Occasion
            </label>
            <select
              value={preferences.occasion}
              onChange={(event) => setPreferences((prev) => ({ ...prev, occasion: event.target.value }))}
              className="h-11 w-full rounded-xl border border-[#d8cab7] bg-[#fdfbf7] px-3 text-sm"
            >
              <option value="">Any</option>
              {occasionOptions.map((occasion) => (
                <option key={occasion} value={occasion}>
                  {toLabel(occasion)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-[0.1em] text-[#7a6654]">
              Budget
            </label>
            <select
              value={preferences.budget}
              onChange={(event) =>
                setPreferences((prev) => ({
                  ...prev,
                  budget: event.target.value as FinderPreferences["budget"],
                }))
              }
              className="h-11 w-full rounded-xl border border-[#d8cab7] bg-[#fdfbf7] px-3 text-sm"
            >
              <option value="any">Any</option>
              <option value="budget">Budget</option>
              <option value="mid">Mid</option>
              <option value="premium">Premium</option>
              <option value="luxury">Luxury</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-[0.1em] text-[#7a6654]">
              Preferred note
            </label>
            <select
              value={preferences.preferredNote}
              onChange={(event) =>
                setPreferences((prev) => ({ ...prev, preferredNote: event.target.value }))
              }
              className="h-11 w-full rounded-xl border border-[#d8cab7] bg-[#fdfbf7] px-3 text-sm"
            >
              <option value="">Any</option>
              {noteOptions.map((note) => (
                <option key={note} value={note}>
                  {toLabel(note)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center justify-between rounded-xl border border-[#dfd1bf] px-3 py-2">
              <span className="text-sm text-[#2a2018]">Arabic only</span>
              <input
                type="checkbox"
                checked={preferences.arabicOnly}
                onChange={(event) =>
                  setPreferences((prev) => ({ ...prev, arabicOnly: event.target.checked }))
                }
                className="h-4 w-4"
              />
            </label>

            <label className="flex items-center justify-between rounded-xl border border-[#dfd1bf] px-3 py-2">
              <span className="text-sm text-[#2a2018]">Niche only</span>
              <input
                type="checkbox"
                checked={preferences.nicheOnly}
                onChange={(event) =>
                  setPreferences((prev) => ({ ...prev, nicheOnly: event.target.checked }))
                }
                className="h-4 w-4"
              />
            </label>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Finding..." : "Find fragrances"}
          </Button>
          <Button type="button" variant="secondary" onClick={resetForm}>
            Reset
          </Button>
        </div>
      </form>

      {submitted ? (
        <section className="space-y-4">
          <p className="text-sm text-[#615140]">
            Found <span className="font-semibold text-[#2a2018]">{totalMatches}</span> matching fragrances
          </p>
          {errorMessage ? (
            <div className="rounded-xl border border-[#dfd1bf] bg-[#faf4eb] px-4 py-3 text-sm text-[#6b5747]">
              {errorMessage}
            </div>
          ) : null}
          <PerfumeGrid perfumes={displayedResults} />

          {hasMoreVisibleResults && !isCatalogLocked ? <div ref={loadMoreRef} className="h-6 w-full" /> : null}

          {isCatalogLocked ? <CatalogGate previewLimit={FREE_FINDER_PREVIEW_LIMIT} /> : null}
        </section>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#d8c9b6] bg-[#fbf7f0] p-8 text-sm text-[#655444]">
          Choose a few preferences and run Finder to see fragrances that fit your taste.
        </div>
      )}
    </div>
  );
}
