"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { CatalogGate } from "@/components/catalog/CatalogGate";
import { PerfumeGrid } from "@/components/perfumes/PerfumeGrid";
import { Button } from "@/components/ui/Button";
import {
  defaultFinderPreferences,
  type FinderPerfume,
  type FinderPreferences,
} from "@/lib/finder";
import { useAuthStatus } from "@/lib/supabase/use-auth-status";

type FinderOptions = {
  moods: string[];
  seasons: string[];
  occasions: string[];
  notes: string[];
};

type FinderExperienceProps = {
  availableOptions: FinderOptions;
  isAuthenticated: boolean;
  initialPreferences: FinderPreferences;
  presetLabel?: string | null;
};

function toLabel(
  slug: string,
  type: "moods" | "seasons" | "occasions" | "notes",
  t: {
    has: (key: string) => boolean;
    (key: string): string;
  },
) {
  const key = `${type}.${slug}`;
  if (t.has(key)) {
    return t(key);
  }

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

type FinderSearchPayload = {
  results: FinderPerfume[];
  total: number;
  hasMore: boolean;
  nextOffset: number;
};

export function FinderExperience({
  availableOptions,
  isAuthenticated,
  initialPreferences,
  presetLabel,
}: FinderExperienceProps) {
  const t = useTranslations("finder.experience");
  const taxonomyT = useTranslations("taxonomy");
  const authStatus = useAuthStatus(isAuthenticated);
  const [preferences, setPreferences] = useState<FinderPreferences>(initialPreferences);
  const [results, setResults] = useState<FinderPerfume[]>([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [nextOffset, setNextOffset] = useState(0);
  const [hasMoreResults, setHasMoreResults] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const isFetchingMoreRef = useRef(false);
  const hasAutoRunRef = useRef(false);

  const moodOptions = useMemo(
    () => withSelectedOption(availableOptions.moods, preferences.mood),
    [availableOptions.moods, preferences.mood],
  );

  const seasonOptions = useMemo(
    () => withSelectedOption(availableOptions.seasons, preferences.season),
    [availableOptions.seasons, preferences.season],
  );

  const occasionOptions = useMemo(
    () => withSelectedOption(availableOptions.occasions, preferences.occasion),
    [availableOptions.occasions, preferences.occasion],
  );

  const noteOptions = useMemo(
    () => withSelectedOption(availableOptions.notes, preferences.preferredNote),
    [availableOptions.notes, preferences.preferredNote],
  );

  const presetChips = useMemo(() => {
    const chips: string[] = [];

    if (preferences.mood) chips.push(t("chips.mood", { value: toLabel(preferences.mood, "moods", taxonomyT) }));
    if (preferences.season) chips.push(t("chips.season", { value: toLabel(preferences.season, "seasons", taxonomyT) }));
    if (preferences.occasion) {
      chips.push(t("chips.occasion", { value: toLabel(preferences.occasion, "occasions", taxonomyT) }));
    }
    if (preferences.preferredNote) {
      chips.push(t("chips.note", { value: toLabel(preferences.preferredNote, "notes", taxonomyT) }));
    }
    if (preferences.arabicOnly) chips.push(t("arabicOnly"));
    if (preferences.nicheOnly) chips.push(t("nicheOnly"));

    return chips;
  }, [
    preferences.arabicOnly,
    preferences.mood,
    preferences.nicheOnly,
    preferences.occasion,
    preferences.preferredNote,
    preferences.season,
    t,
    taxonomyT,
  ]);

  const applyFinderPage = useCallback(
    (payload: FinderSearchPayload, mode: "replace" | "append") => {
      setResults((current) => {
        const remainingPreviewSlots = Math.max(
          0,
          FREE_FINDER_PREVIEW_LIMIT - (mode === "append" ? current.length : 0),
        );
        const fetchedResults =
          mode === "append" && !authStatus
            ? payload.results.slice(0, remainingPreviewSlots)
            : authStatus
              ? payload.results
              : payload.results.slice(0, FREE_FINDER_PREVIEW_LIMIT);

        if (mode === "replace") {
          return fetchedResults;
        }

        const existingIds = new Set(current.map((item) => item.id));
        const nextItems = fetchedResults.filter((item) => !existingIds.has(item.id));
        return [...current, ...nextItems];
      });

      setTotalMatches(payload.total ?? payload.results.length);
      setHasMoreResults(payload.hasMore);
      setNextOffset(payload.nextOffset);
    },
    [authStatus],
  );

  const runFinderSearch = useCallback(async (nextPreferences: FinderPreferences) => {
    setIsLoading(true);
    setErrorMessage(null);
    setResults([]);
    setTotalMatches(0);
    setNextOffset(0);
    setHasMoreResults(false);

    try {
      const response = await fetch("/api/finder", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          ...nextPreferences,
          offset: 0,
          limit: FINDER_RESULTS_PAGE_SIZE,
        }),
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Finder request failed with status ${response.status}`);
      }

      const payload = (await response.json()) as FinderSearchPayload;
      applyFinderPage(payload, "replace");
      setSubmitted(true);
    } catch {
      setResults([]);
      setTotalMatches(0);
      setNextOffset(0);
      setHasMoreResults(false);
      setSubmitted(true);
      setErrorMessage(t("fallbackError"));
    } finally {
      setIsLoading(false);
    }
  }, [applyFinderPage, t]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await runFinderSearch(preferences);
  };

  const resetForm = () => {
    setPreferences(defaultFinderPreferences);
    setResults([]);
    setTotalMatches(0);
    setNextOffset(0);
    setHasMoreResults(false);
    setSubmitted(false);
    setErrorMessage(null);
    setIsLoading(false);
    setIsLoadingMore(false);
  };

  useEffect(() => {
    if (hasAutoRunRef.current || !hasConfiguredPreferences(initialPreferences)) {
      return;
    }

    hasAutoRunRef.current = true;
    void runFinderSearch(initialPreferences);
  }, [initialPreferences, runFinderSearch]);

  const isCatalogLocked = !authStatus && totalMatches > results.length && results.length >= FREE_FINDER_PREVIEW_LIMIT;
  const canLoadMore = hasMoreResults && !isCatalogLocked;
  const showPresetBanner = Boolean(presetLabel) && hasConfiguredPreferences(preferences);

  const loadMoreResults = useCallback(async () => {
    if (isFetchingMoreRef.current || !canLoadMore) {
      return;
    }

    isFetchingMoreRef.current = true;
    setIsLoadingMore(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/finder", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          ...preferences,
          offset: nextOffset,
          limit: FINDER_RESULTS_PAGE_SIZE,
        }),
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Finder request failed with status ${response.status}`);
      }

      const payload = (await response.json()) as FinderSearchPayload;
      applyFinderPage(payload, "append");
    } catch {
      setErrorMessage(t("fallbackError"));
    } finally {
      setIsLoadingMore(false);
      isFetchingMoreRef.current = false;
    }
  }, [applyFinderPage, canLoadMore, nextOffset, preferences, t]);

  useEffect(() => {
    if (!submitted || !loadMoreRef.current || !canLoadMore) {
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
  }, [canLoadMore, loadMoreResults, submitted]);

  return (
    <div className="space-y-8">
      {showPresetBanner ? (
        <div className="rounded-[1.75rem] border border-[#dfd1bf] bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(247,239,229,0.95))] p-5 shadow-[0_22px_46px_-36px_rgba(50,35,20,0.34)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a7763]">
            {t("preset.eyebrow")}
          </p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-3xl text-[#1f1914]">
                {presetLabel ? presetLabel : t("preset.fallbackTitle")}
              </h2>
              <p className="mt-1 text-sm text-[#635343]">
                {t("preset.description")}
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
              {t("fields.mood")}
            </label>
            <select
              value={preferences.mood}
              onChange={(event) => setPreferences((prev) => ({ ...prev, mood: event.target.value }))}
              className="h-11 w-full rounded-xl border border-[#d8cab7] bg-[#fdfbf7] px-3 text-sm"
            >
              <option value="">{t("any")}</option>
              {moodOptions.map((mood) => (
                <option key={mood} value={mood}>
                  {toLabel(mood, "moods", taxonomyT)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-[0.1em] text-[#7a6654]">
              {t("fields.season")}
            </label>
            <select
              value={preferences.season}
              onChange={(event) => setPreferences((prev) => ({ ...prev, season: event.target.value }))}
              className="h-11 w-full rounded-xl border border-[#d8cab7] bg-[#fdfbf7] px-3 text-sm"
            >
              <option value="">{t("any")}</option>
              {seasonOptions.map((season) => (
                <option key={season} value={season}>
                  {toLabel(season, "seasons", taxonomyT)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-[0.1em] text-[#7a6654]">
              {t("fields.occasion")}
            </label>
            <select
              value={preferences.occasion}
              onChange={(event) => setPreferences((prev) => ({ ...prev, occasion: event.target.value }))}
              className="h-11 w-full rounded-xl border border-[#d8cab7] bg-[#fdfbf7] px-3 text-sm"
            >
              <option value="">{t("any")}</option>
              {occasionOptions.map((occasion) => (
                <option key={occasion} value={occasion}>
                  {toLabel(occasion, "occasions", taxonomyT)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-[0.1em] text-[#7a6654]">
              {t("fields.budget")}
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
              <option value="any">{t("budget.any")}</option>
              <option value="budget">{t("budget.budget")}</option>
              <option value="mid">{t("budget.mid")}</option>
              <option value="premium">{t("budget.premium")}</option>
              <option value="luxury">{t("budget.luxury")}</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-[0.1em] text-[#7a6654]">
              {t("fields.note")}
            </label>
            <select
              value={preferences.preferredNote}
              onChange={(event) =>
                setPreferences((prev) => ({ ...prev, preferredNote: event.target.value }))
              }
              className="h-11 w-full rounded-xl border border-[#d8cab7] bg-[#fdfbf7] px-3 text-sm"
            >
              <option value="">{t("any")}</option>
              {noteOptions.map((note) => (
                <option key={note} value={note}>
                  {toLabel(note, "notes", taxonomyT)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-[0.1em] text-[#7a6654]">
              {t("fields.gender")}
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
              <option value="any">{t("gender.any")}</option>
              <option value="male">{t("gender.male")}</option>
              <option value="female">{t("gender.female")}</option>
              <option value="unisex">{t("gender.unisex")}</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? t("finding") : t("submit")}
            </Button>
            <Button type="button" variant="secondary" onClick={resetForm}>
              {t("reset")}
            </Button>
          </div>

          <div className="flex flex-wrap gap-3 lg:justify-end">
            <label className="flex items-center gap-2 rounded-xl border border-[#dfd1bf] px-3 py-2">
              <span className="text-sm text-[#2a2018]">{t("arabicOnly")}</span>
              <input
                type="checkbox"
                checked={preferences.arabicOnly}
                onChange={(event) =>
                  setPreferences((prev) => ({ ...prev, arabicOnly: event.target.checked }))
                }
                className="h-4 w-4"
              />
            </label>

            <label className="flex items-center gap-2 rounded-xl border border-[#dfd1bf] px-3 py-2">
              <span className="text-sm text-[#2a2018]">{t("nicheOnly")}</span>
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
      </form>

      {submitted ? (
        <section className="space-y-4">
          <p className="text-sm text-[#615140]">
            {t("results", { total: totalMatches })}
          </p>
          {errorMessage ? (
            <div className="rounded-xl border border-[#dfd1bf] bg-[#faf4eb] px-4 py-3 text-sm text-[#6b5747]">
              {errorMessage}
            </div>
          ) : null}
          <PerfumeGrid perfumes={results} />

          {isLoadingMore ? <p className="text-sm text-[#7a6654]">{t("finding")}</p> : null}

          {canLoadMore ? <div ref={loadMoreRef} className="h-6 w-full" /> : null}

          {isCatalogLocked ? <CatalogGate previewLimit={FREE_FINDER_PREVIEW_LIMIT} /> : null}
        </section>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#d8c9b6] bg-[#fbf7f0] p-8 text-sm text-[#655444]">
          {t("empty")}
        </div>
      )}
    </div>
  );
}
