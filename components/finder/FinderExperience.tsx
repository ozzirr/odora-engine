"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { CatalogGate } from "@/components/catalog/CatalogGate";
import { PerfumeGrid } from "@/components/perfumes/PerfumeGrid";
import { Button } from "@/components/ui/Button";
import {
  defaultFinderPreferences,
  serializeFinderPreferences,
  type FinderPerfume,
  type FinderPreferences,
} from "@/lib/finder";
import { useAuthStatus } from "@/lib/supabase/use-auth-status";
import { getLocalizedTaxonomyLabel } from "@/lib/taxonomy-display";
import { cn } from "@/lib/utils";

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
  initialResults: FinderPerfume[];
  initialTotal: number;
  initialHasMore: boolean;
  initialNextOffset: number;
  initialSubmitted: boolean;
  presetLabel?: string | null;
};

type FinderSearchPayload = {
  results: FinderPerfume[];
  total: number;
  hasMore: boolean;
  nextOffset: number;
};

type ChoiceOption = {
  value: string;
  label: string;
  hint: string;
  visual: string;
};

const FINDER_RESULTS_PAGE_SIZE = 20;
const FREE_FINDER_PREVIEW_LIMIT = 10;
const CURATED_MOODS = ["elegant", "fresh", "romantic", "bold", "cozy"];
const CURATED_SEASONS = ["spring", "summer", "fall", "winter"];
const CURATED_OCCASIONS = ["daily-wear", "office", "date-night"];
const CURATED_NOTES = ["bergamot", "vanilla", "oud", "musk", "amber", "rose", "sandalwood", "citrus"];
const HINTED_MOODS = new Set(CURATED_MOODS);
const HINTED_SEASONS = new Set(CURATED_SEASONS);
const HINTED_OCCASIONS = new Set(CURATED_OCCASIONS);
const HINTED_NOTES = new Set(CURATED_NOTES);

function withSelectedOption(options: string[], selectedValue: string) {
  if (!selectedValue || options.includes(selectedValue)) {
    return options;
  }

  return [selectedValue, ...options];
}

function prioritizeOptions(available: string[], curated: string[], selectedValue: string) {
  const source = available.length ? available : curated;
  const ordered = [
    ...curated.filter((item) => source.includes(item)),
    ...source.filter((item) => !curated.includes(item)),
  ];
  return withSelectedOption(Array.from(new Set(ordered)), selectedValue).slice(0, 4);
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

function FinderSearchLoading({
  eyebrow,
  title,
  description,
  items,
}: {
  eyebrow: string;
  title: string;
  description: string;
  items: string[];
}) {
  return (
    <section className="grid min-h-[calc(100svh-10.5rem)] items-center py-6">
      <div className="relative overflow-hidden rounded-[1.8rem] border border-white/12 bg-white/[0.08] p-6 text-[#fff8ed] sm:p-8 lg:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(217,183,127,0.24),transparent_30%),radial-gradient(circle_at_80%_30%,rgba(255,250,241,0.12),transparent_26%)]" />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_18rem] lg:items-center">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d9b77f]">
              {eyebrow}
            </p>
            <h2 className="mt-4 max-w-2xl font-display text-[2.6rem] leading-[0.95] sm:text-[4rem]">
              {title}
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-6 text-[#dac8ad] sm:text-base sm:leading-7">
              {description}
            </p>

            <div className="mt-7 grid gap-3">
              {items.map((item, index) => (
                <div key={item} className="flex items-center gap-3 text-sm text-[#ead8bd]">
                  <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#d9b77f]/45 bg-[#d9b77f]/15">
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full bg-[#d9b77f]",
                        index === 0 ? "animate-pulse" : index === 1 ? "animate-[pulse_1.4s_ease-in-out_infinite]" : "animate-[pulse_1.8s_ease-in-out_infinite]",
                      )}
                    />
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mx-auto h-64 w-64 max-w-full">
            <div className="absolute inset-0 rounded-full border border-[#d9b77f]/25" />
            <div className="absolute inset-8 rounded-full border border-white/15" />
            <div className="absolute inset-16 rounded-full bg-[#fffaf1] shadow-[0_30px_90px_-45px_rgba(0,0,0,0.9)]" />
            <div className="absolute left-1/2 top-1/2 h-28 w-16 -translate-x-1/2 -translate-y-1/2 rounded-[45%_45%_38%_38%] border border-[#d8cab7] bg-gradient-to-b from-white via-[#f7efe3] to-[#d9c6ad] shadow-[0_18px_60px_-35px_rgba(0,0,0,0.75)]" />
            <div className="absolute left-1/2 top-[4.2rem] h-5 w-10 -translate-x-1/2 rounded-t-lg bg-[#d8cab7]" />
            <div className="absolute inset-0 animate-spin rounded-full border-t border-[#d9b77f]" />
          </div>
        </div>
      </div>
    </section>
  );
}

export function FinderExperience({
  availableOptions,
  isAuthenticated,
  initialPreferences,
  initialResults,
  initialTotal,
  initialHasMore,
  initialNextOffset,
  initialSubmitted,
  presetLabel,
}: FinderExperienceProps) {
  const t = useTranslations("finder.experience");
  const taxonomyT = useTranslations("taxonomy");
  const locale = useLocale();
  const authStatus = useAuthStatus(isAuthenticated);
  const [preferences, setPreferences] = useState<FinderPreferences>(initialPreferences);
  const [results, setResults] = useState<FinderPerfume[]>(
    isAuthenticated ? initialResults : initialResults.slice(0, FREE_FINDER_PREVIEW_LIMIT),
  );
  const [totalMatches, setTotalMatches] = useState(initialTotal);
  const [nextOffset, setNextOffset] = useState(initialNextOffset);
  const [hasMoreResults, setHasMoreResults] = useState(initialHasMore);
  const [submitted, setSubmitted] = useState(initialSubmitted);
  const [activePresetLabel, setActivePresetLabel] = useState<string | null>(presetLabel ?? null);
  const [isStarted, setIsStarted] = useState(initialSubmitted);
  const [activeStep, setActiveStep] = useState(initialSubmitted ? 5 : 0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resultAnimationKey, setResultAnimationKey] = useState(0);
  const [leadEmail, setLeadEmail] = useState("");
  const [leadConsent, setLeadConsent] = useState(true);
  const [leadStatus, setLeadStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [leadMessage, setLeadMessage] = useState<string | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const isFetchingMoreRef = useRef(false);
  const hasLocalSubmittedSearchRef = useRef(initialSubmitted);

  const moodOptions = useMemo(
    () => prioritizeOptions(availableOptions.moods, CURATED_MOODS, preferences.mood),
    [availableOptions.moods, preferences.mood],
  );
  const seasonOptions = useMemo(
    () => prioritizeOptions(availableOptions.seasons, CURATED_SEASONS, preferences.season),
    [availableOptions.seasons, preferences.season],
  );
  const occasionOptions = useMemo(
    () => prioritizeOptions(availableOptions.occasions, CURATED_OCCASIONS, preferences.occasion),
    [availableOptions.occasions, preferences.occasion],
  );
  const noteOptions = useMemo(
    () => prioritizeOptions(availableOptions.notes, CURATED_NOTES, preferences.preferredNote),
    [availableOptions.notes, preferences.preferredNote],
  );

  const moodChoiceOptions = useMemo(
    () =>
      moodOptions.map((value, index) => ({
        value,
        label: getLocalizedTaxonomyLabel(value, "moods", taxonomyT),
        hint: HINTED_MOODS.has(value) ? t(`choiceHints.moods.${value}`) : t("choiceHints.defaultMood"),
        visual: ["from-[#f3e5cf] via-[#fff7ec] to-[#c8b08c]", "from-[#dfeee4] via-[#f8fff9] to-[#9eb8a2]", "from-[#f3d4c9] via-[#fff4ef] to-[#c89283]", "from-[#dac6ad] via-[#f3e9dc] to-[#7a5038]", "from-[#eee0ca] via-[#fff9ef] to-[#ba8d5a]"][index % 5],
      })),
    [moodOptions, t, taxonomyT],
  );

  const seasonChoiceOptions = useMemo(
    () =>
      seasonOptions.map((value, index) => ({
        value,
        label: getLocalizedTaxonomyLabel(value, "seasons", taxonomyT),
        hint: HINTED_SEASONS.has(value) ? t(`choiceHints.seasons.${value}`) : t("choiceHints.defaultSeason"),
        visual: ["from-[#d9ead8] via-[#fff9eb] to-[#f1c6ad]", "from-[#d8eef0] via-[#fff8df] to-[#e8c15c]", "from-[#f0d0a5] via-[#fff1df] to-[#996548]", "from-[#d8e0e5] via-[#f8fbff] to-[#8b9aa4]"][index % 4],
      })),
    [seasonOptions, t, taxonomyT],
  );

  const occasionChoiceOptions = useMemo(
    () =>
      occasionOptions.map((value, index) => ({
        value,
        label: getLocalizedTaxonomyLabel(value, "occasions", taxonomyT),
        hint: HINTED_OCCASIONS.has(value) ? t(`choiceHints.occasions.${value}`) : t("choiceHints.defaultOccasion"),
        visual: ["from-[#eee2d2] via-[#fffaf2] to-[#ccb89d]", "from-[#dce7df] via-[#f9fff9] to-[#95aa99]", "from-[#d8c0b5] via-[#fff0e7] to-[#5a423a]"][index % 3],
      })),
    [occasionOptions, t, taxonomyT],
  );

  const noteChoiceOptions = useMemo(
    () =>
      noteOptions.map((value, index) => ({
        value,
        label: getLocalizedTaxonomyLabel(value, "notes", taxonomyT),
        hint: HINTED_NOTES.has(value) ? t(`choiceHints.notes.${value}`) : t("choiceHints.defaultNote"),
        visual: ["from-[#f3d57a] via-[#fff8dd] to-[#d59253]", "from-[#f5dfc4] via-[#fff8ee] to-[#af7b57]", "from-[#d3c2aa] via-[#f4eadc] to-[#3d3028]", "from-[#e3e7df] via-[#ffffff] to-[#a4aaa0]", "from-[#ead4aa] via-[#fff6e7] to-[#9d7145]", "from-[#f0cad0] via-[#fff4f5] to-[#ba7883]"][index % 6],
      })),
    [noteOptions, t, taxonomyT],
  );

  const genderChoiceOptions: ChoiceOption[] = useMemo(
    () => [
      { value: "any", label: t("gender.any"), hint: t("choiceHints.gender.any"), visual: "from-[#e6d8c7] via-[#fffaf2] to-[#a88968]" },
      { value: "male", label: t("gender.male"), hint: t("choiceHints.gender.male"), visual: "from-[#d6dfdf] via-[#f5fbf9] to-[#64786f]" },
      { value: "female", label: t("gender.female"), hint: t("choiceHints.gender.female"), visual: "from-[#f0d4cc] via-[#fff7f2] to-[#b48270]" },
      { value: "unisex", label: t("gender.unisex"), hint: t("choiceHints.gender.unisex"), visual: "from-[#e4ddc6] via-[#fbfaf1] to-[#829172]" },
    ],
    [t],
  );

  const budgetChoiceOptions: ChoiceOption[] = useMemo(
    () => [
      { value: "any", label: t("budget.any"), hint: t("choiceHints.budget.any"), visual: "from-[#e8ddce] via-[#fffaf2] to-[#c5b097]" },
      { value: "budget", label: t("budget.budget"), hint: t("choiceHints.budget.budget"), visual: "from-[#dbe8d7] via-[#fbfff6] to-[#8ca478]" },
      { value: "mid", label: t("budget.mid"), hint: t("choiceHints.budget.mid"), visual: "from-[#e6ddca] via-[#fff8ea] to-[#ba9a68]" },
      { value: "premium", label: t("budget.premium"), hint: t("choiceHints.budget.premium"), visual: "from-[#d8d0c1] via-[#faf4ea] to-[#756b5e]" },
      { value: "luxury", label: t("budget.luxury"), hint: t("choiceHints.budget.luxury"), visual: "from-[#cabba5] via-[#f6eee2] to-[#2e2924]" },
    ],
    [t],
  );

  const steps = useMemo(
    () => [
      {
        id: "mood",
        title: t("steps.mood.title"),
        eyebrow: t("steps.mood.eyebrow"),
        description: t("steps.mood.description"),
        value: preferences.mood,
        options: moodChoiceOptions,
        onSelect: (value: string) => setPreferences((prev) => ({ ...prev, mood: value })),
      },
      {
        id: "season",
        title: t("steps.season.title"),
        eyebrow: t("steps.season.eyebrow"),
        description: t("steps.season.description"),
        value: preferences.season,
        options: seasonChoiceOptions,
        onSelect: (value: string) => setPreferences((prev) => ({ ...prev, season: value })),
      },
      {
        id: "occasion",
        title: t("steps.occasion.title"),
        eyebrow: t("steps.occasion.eyebrow"),
        description: t("steps.occasion.description"),
        value: preferences.occasion,
        options: occasionChoiceOptions,
        onSelect: (value: string) => setPreferences((prev) => ({ ...prev, occasion: value })),
      },
      {
        id: "note",
        title: t("steps.note.title"),
        eyebrow: t("steps.note.eyebrow"),
        description: t("steps.note.description"),
        value: preferences.preferredNote,
        options: noteChoiceOptions,
        onSelect: (value: string) => setPreferences((prev) => ({ ...prev, preferredNote: value })),
      },
      {
        id: "budget",
        title: t("steps.budget.title"),
        eyebrow: t("steps.budget.eyebrow"),
        description: t("steps.budget.description"),
        value: preferences.budget,
        options: budgetChoiceOptions,
        onSelect: (value: string) =>
          setPreferences((prev) => ({ ...prev, budget: value as FinderPreferences["budget"] })),
      },
      {
        id: "gender",
        title: t("steps.gender.title"),
        eyebrow: t("steps.gender.eyebrow"),
        description: t("steps.gender.description"),
        value: preferences.gender,
        options: genderChoiceOptions,
        onSelect: (value: string) =>
          setPreferences((prev) => ({ ...prev, gender: value as FinderPreferences["gender"] })),
      },
    ],
    [
      budgetChoiceOptions,
      genderChoiceOptions,
      moodChoiceOptions,
      noteChoiceOptions,
      occasionChoiceOptions,
      preferences.budget,
      preferences.gender,
      preferences.mood,
      preferences.occasion,
      preferences.preferredNote,
      preferences.season,
      seasonChoiceOptions,
      t,
    ],
  );

  const activeStepConfig = steps[activeStep] ?? steps[0];
  const progress = Math.round(((activeStep + 1) / steps.length) * 100);

  const preserveViewportPosition = useCallback((update: () => void) => {
    if (typeof window === "undefined") {
      update();
      return;
    }

    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    update();

    window.requestAnimationFrame(() => {
      window.scrollTo({ left: scrollX, top: scrollY, behavior: "auto" });
      window.requestAnimationFrame(() => {
        window.scrollTo({ left: scrollX, top: scrollY, behavior: "auto" });
      });
    });
  }, []);

  const presetChips = useMemo(() => {
    const chips: string[] = [];

    if (preferences.mood) {
      chips.push(t("chips.mood", { value: getLocalizedTaxonomyLabel(preferences.mood, "moods", taxonomyT) }));
    }
    if (preferences.season) {
      chips.push(t("chips.season", { value: getLocalizedTaxonomyLabel(preferences.season, "seasons", taxonomyT) }));
    }
    if (preferences.occasion) {
      chips.push(t("chips.occasion", { value: getLocalizedTaxonomyLabel(preferences.occasion, "occasions", taxonomyT) }));
    }
    if (preferences.preferredNote) {
      chips.push(t("chips.note", { value: getLocalizedTaxonomyLabel(preferences.preferredNote, "notes", taxonomyT) }));
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

  const initialPreferenceSignature = useMemo(
    () => serializeFinderPreferences(initialPreferences),
    [initialPreferences],
  );
  const currentPreferenceSignature = useMemo(
    () => serializeFinderPreferences(preferences),
    [preferences],
  );

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

  useEffect(() => {
    if (hasLocalSubmittedSearchRef.current && !initialSubmitted) {
      return;
    }

    hasLocalSubmittedSearchRef.current = initialSubmitted;
    setPreferences(initialPreferences);
    setResults(authStatus ? initialResults : initialResults.slice(0, FREE_FINDER_PREVIEW_LIMIT));
    setTotalMatches(initialTotal);
    setNextOffset(initialNextOffset);
    setHasMoreResults(initialHasMore);
    setSubmitted(initialSubmitted);
    setActivePresetLabel(presetLabel ?? null);
    setIsStarted(initialSubmitted);
    setActiveStep(initialSubmitted ? 5 : 0);
    setErrorMessage(null);
    setIsLoading(false);
    setIsLoadingMore(false);
    setLeadStatus("idle");
    setLeadMessage(null);
    if (initialSubmitted) {
      setResultAnimationKey((current) => current + 1);
    }
    isFetchingMoreRef.current = false;
  }, [
    initialHasMore,
    initialNextOffset,
    initialPreferences,
    initialResults,
    initialSubmitted,
    initialTotal,
    authStatus,
    presetLabel,
  ]);

  const buildFinderQueryParams = useCallback(
    (nextPreferences: FinderPreferences, nextPresetLabel?: string | null, nextSubmitted = true) => {
      const params = new URLSearchParams();

      if (nextSubmitted) params.set("submitted", "1");
      if (nextPreferences.gender !== "any") params.set("gender", nextPreferences.gender);
      if (nextPreferences.mood) params.set("mood", nextPreferences.mood);
      if (nextPreferences.season) params.set("season", nextPreferences.season);
      if (nextPreferences.occasion) params.set("occasion", nextPreferences.occasion);
      if (nextPreferences.budget !== "any") params.set("budget", nextPreferences.budget);
      if (nextPreferences.preferredNote) params.set("preferredNote", nextPreferences.preferredNote);
      if (nextPreferences.arabicOnly) params.set("arabicOnly", "true");
      if (nextPreferences.nicheOnly) params.set("nicheOnly", "true");
      if (nextPresetLabel) params.set("preset", nextPresetLabel);

      return params;
    },
    [],
  );

  const syncFinderHistory = useCallback((params: URLSearchParams) => {
    if (typeof window === "undefined") {
      return;
    }

    const nextQuery = params.toString();
    const nextUrl = nextQuery ? `${window.location.pathname}?${nextQuery}` : window.location.pathname;
    window.history.replaceState(window.history.state, "", nextUrl);
  }, []);

  const runFinderSearch = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    hasLocalSubmittedSearchRef.current = true;
    setSubmitted(true);

    const preservePreset = presetLabel && currentPreferenceSignature === initialPreferenceSignature ? presetLabel : null;
    const nextParams = buildFinderQueryParams(preferences, preservePreset, true);

    try {
      const response = await fetch("/api/finder", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          ...preferences,
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
      setActivePresetLabel(preservePreset);
      setResultAnimationKey((current) => current + 1);
      syncFinderHistory(nextParams);
    } catch {
      setErrorMessage(t("fallbackError"));
    } finally {
      setIsLoading(false);
    }
  }, [
    applyFinderPage,
    buildFinderQueryParams,
    currentPreferenceSignature,
    initialPreferenceSignature,
    preferences,
    presetLabel,
    syncFinderHistory,
    t,
  ]);

  const resetForm = () => {
    hasLocalSubmittedSearchRef.current = false;
    setPreferences(defaultFinderPreferences);
    setResults([]);
    setTotalMatches(0);
    setNextOffset(0);
    setHasMoreResults(false);
    setSubmitted(false);
    setActivePresetLabel(null);
    setIsStarted(false);
    setActiveStep(0);
    setErrorMessage(null);
    setIsLoading(false);
    setIsLoadingMore(false);
    setLeadStatus("idle");
    setLeadMessage(null);
    syncFinderHistory(buildFinderQueryParams(defaultFinderPreferences, null, false));
    isFetchingMoreRef.current = false;
  };

  const isCatalogLocked = !authStatus && totalMatches > results.length && results.length >= FREE_FINDER_PREVIEW_LIMIT;
  const canLoadMore = hasMoreResults && !isCatalogLocked;
  const showPresetBanner = Boolean(activePresetLabel) && hasConfiguredPreferences(preferences);
  const featuredResults = results.slice(0, 3);

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

  const handleLeadSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLeadStatus("submitting");
    setLeadMessage(null);

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email: leadEmail,
          locale,
          consent: leadConsent,
        }),
      });

      if (!response.ok) {
        throw new Error(`Lead capture failed with status ${response.status}`);
      }

      setLeadStatus("success");
      setLeadMessage(t("lead.success"));
    } catch {
      setLeadStatus("error");
      setLeadMessage(t("lead.error"));
    }
  };

  const goToNextStep = () => {
    if (activeStep < steps.length - 1) {
      preserveViewportPosition(() => {
        setActiveStep((current) => Math.min(steps.length - 1, current + 1));
      });
      return;
    }

    void runFinderSearch();
  };

  const skipCurrentStep = () => {
    const stepId = activeStepConfig.id;
    setPreferences((prev) => {
      if (stepId === "mood") return { ...prev, mood: "" };
      if (stepId === "season") return { ...prev, season: "" };
      if (stepId === "occasion") return { ...prev, occasion: "" };
      if (stepId === "note") return { ...prev, preferredNote: "" };
      if (stepId === "budget") return { ...prev, budget: "any" };
      if (stepId === "gender") return { ...prev, gender: "any" };
      return prev;
    });
    goToNextStep();
  };

  return (
    <div className="relative isolate overflow-hidden bg-[#211914] text-[#fff8ed] [overflow-anchor:none]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(238,205,157,0.32),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(111,139,111,0.24),transparent_26%),linear-gradient(135deg,#1b1511_0%,#33241c_48%,#14120f_100%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-white/35" />

      <div className="relative mx-auto min-h-[calc(100svh-4.5rem)] w-full max-w-6xl p-4 sm:p-6 lg:p-8">
        {!isStarted && !submitted ? (
          <section className="grid min-h-[calc(100svh-10.5rem)] items-center gap-8 lg:grid-cols-[minmax(0,1fr)_26rem]">
            <div className="max-w-3xl">
              <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ead8bd]">
                {t("immersive.eyebrow")}
              </div>
              <h1 className="mt-6 max-w-[11ch] font-display text-[3.6rem] leading-[0.86] text-[#fff7ea] sm:text-[5rem] lg:text-[6.2rem]">
                {t("immersive.title")}
              </h1>
              <p className="mt-6 max-w-xl text-[15px] leading-7 text-[#d7c4aa] sm:text-lg sm:leading-8">
                {t("immersive.subtitle")}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button type="button" size="lg" onClick={() => preserveViewportPosition(() => setIsStarted(true))}>
                  {t("start")}
                </Button>
                {submitted ? (
                  <Button type="button" variant="secondary" size="lg" onClick={() => preserveViewportPosition(() => setIsStarted(true))}>
                    {t("back")}
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="hidden rounded-[1.6rem] border border-white/12 bg-white/[0.07] p-5 backdrop-blur lg:block">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d9b77f]">
                {t("report.eyebrow")}
              </p>
              <div className="mt-5 space-y-3">
                {[
                  t("steps.mood.eyebrow"),
                  t("steps.season.eyebrow"),
                  t("steps.occasion.eyebrow"),
                  t("steps.note.eyebrow"),
                  t("steps.budget.eyebrow"),
                  t("steps.gender.eyebrow"),
                ].map((item, index) => (
                  <div key={item} className="flex items-center gap-3 rounded-[1rem] border border-white/10 bg-white/[0.06] px-4 py-3">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-[#d9b77f] text-xs font-bold text-[#211914]">
                      {index + 1}
                    </span>
                    <span className="text-sm font-semibold uppercase tracking-[0.12em] text-[#ead8bd]">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : !submitted ? (
          <section className="flex min-h-[calc(100svh-10.5rem)] flex-col">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d9b77f]">
                  {t("progress", { current: activeStep + 1, total: steps.length })}
                </p>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/12 lg:w-[26rem]">
                  <div className="h-full rounded-full bg-[#d9b77f] transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {steps.map((step, index) => (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => preserveViewportPosition(() => setActiveStep(index))}
                    className={cn(
                      "h-10 shrink-0 rounded-full border px-3 text-[11px] font-semibold uppercase tracking-[0.12em] transition",
                      index === activeStep
                        ? "border-[#d9b77f] bg-[#d9b77f] text-[#1f1710]"
                        : "border-white/12 bg-white/[0.06] text-[#d8c3a6] hover:bg-white/[0.1]",
                    )}
                  >
                    {index + 1}. {step.eyebrow}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 flex flex-1 items-center">
              <div className="w-full rounded-[1.6rem] border border-white/12 bg-[#fffaf1] p-3 text-[#211914] shadow-[0_35px_90px_-58px_rgba(0,0,0,0.75)] sm:p-6 lg:p-7">
                <div className="grid gap-3 sm:gap-5 lg:grid-cols-[minmax(0,0.66fr)_minmax(0,1fr)] lg:items-start">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a6e4d]">
                      {activeStepConfig.eyebrow}
                    </p>
                    <h2 className="mt-2 max-w-xl font-display text-[1.95rem] leading-[0.95] text-[#1e1813] sm:text-[3rem] lg:text-[3.4rem]">
                      {activeStepConfig.title}
                    </h2>
                    <p className="mt-3 hidden max-w-lg text-sm leading-6 text-[#655240] sm:mt-4 sm:block sm:text-base">
                      {activeStepConfig.description}
                    </p>

                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
                    {activeStepConfig.options.map((option) => {
                      const isSelected = activeStepConfig.value === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => activeStepConfig.onSelect(option.value)}
                          className={cn(
                            "group min-h-[5.8rem] overflow-hidden rounded-[1.05rem] border p-0 text-left transition duration-300 hover:-translate-y-0.5 sm:min-h-[8rem]",
                            isSelected
                              ? "border-[#1E4B3B] shadow-[0_18px_48px_-30px_rgba(30,75,59,0.75)]"
                              : "border-[#e1d5c5] shadow-[0_16px_42px_-34px_rgba(50,35,20,0.32)]",
                          )}
                        >
                          <div className={cn("h-6 bg-gradient-to-br sm:h-10", option.visual)} />
                          <div className="p-2 sm:p-3.5">
                            <div className="flex items-start justify-between gap-3">
                              <h3 className="font-display text-[1.08rem] leading-none text-[#201710] sm:text-[1.35rem]">
                                {option.label}
                              </h3>
                              <span
                                className={cn(
                                  "grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[10px]",
                                  isSelected
                                    ? "border-[#1E4B3B] bg-[#1E4B3B] text-white"
                                    : "border-[#d7c8b5] text-[#8a7763]",
                                )}
                              >
                                {isSelected ? "OK" : ""}
                              </span>
                            </div>
                            <p className="mt-2 hidden text-[12.5px] leading-5 text-[#6b5845] sm:line-clamp-2 sm:block">
                              {option.hint}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#e5d9c8] pt-3 sm:mt-5 sm:pt-5">
                  <Button type="button" variant="ghost" size="sm" onClick={skipCurrentStep}>
                    {t("skip")}
                  </Button>

                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    <Button type="button" variant="secondary" size="sm" onClick={resetForm} className="max-sm:hidden">
                      {t("reset")}
                    </Button>
                    {activeStep > 0 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => preserveViewportPosition(() => setActiveStep((current) => Math.max(0, current - 1)))}
                      >
                        {t("back")}
                      </Button>
                    ) : null}
                    <Button type="button" size="sm" onClick={goToNextStep} disabled={isLoading}>
                      {activeStep < steps.length - 1 ? t("next") : isLoading ? t("finding") : t("submit")}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {showPresetBanner ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {presetChips.map((chip) => (
                  <span key={chip} className="rounded-full border border-white/12 bg-white/10 px-3 py-1 text-xs text-[#e8d8c2]">
                    {chip}
                  </span>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}

        {submitted && isLoading ? (
          <FinderSearchLoading
            eyebrow={t("searching.eyebrow")}
            title={t("searching.title")}
            description={t("searching.description")}
            items={[
              t("searching.items.profile"),
              t("searching.items.catalog"),
              t("searching.items.report"),
            ]}
          />
        ) : null}

        {submitted && !isLoading ? (
          <section className="mt-6 space-y-5">
            {errorMessage ? (
              <div className="rounded-[1.2rem] border border-[#dfc19b] bg-[#fff3df] px-4 py-3 text-sm text-[#6b4c27]">
                {errorMessage}
              </div>
            ) : null}

            <div className="rounded-[1.6rem] border border-white/12 bg-white/[0.08] p-4 text-[#fff8ed] sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d9b77f]">
                    {t("resultsEyebrow")}
                  </p>
                  <h2 className="mt-2 font-display text-[2.3rem] leading-none sm:text-[3rem]">
                    {t("results", { total: totalMatches })}
                  </h2>
                </div>
                <p className="max-w-md text-sm leading-6 text-[#dac8ad]">{t("resultsSubtitle")}</p>
              </div>

              <div className="mt-5">
                <PerfumeGrid
                  perfumes={featuredResults.length ? featuredResults : results}
                  cardVariant="finder"
                  layout="list"
                  animateItems
                  itemAnimationKey={resultAnimationKey}
                />
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
              <form
                onSubmit={handleLeadSubmit}
                className="rounded-[1.6rem] border border-[#d9b77f]/30 bg-[#fffaf1] p-5 text-[#211914] sm:p-6"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a6e4d]">
                  {t("lead.eyebrow")}
                </p>
                <h2 className="mt-2 font-display text-[2.4rem] leading-[0.98]">
                  {t("lead.title")}
                </h2>
                <p className="mt-3 text-sm leading-6 text-[#655240]">{t("lead.description")}</p>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <input
                    type="email"
                    required
                    value={leadEmail}
                    onChange={(event) => setLeadEmail(event.target.value)}
                    placeholder={t("lead.placeholder")}
                    className="h-12 min-w-0 flex-1 rounded-full border border-[#d8cab7] bg-white px-4 text-sm text-[#211914] outline-none transition focus:border-[#1E4B3B]"
                  />
                  <Button type="submit" disabled={leadStatus === "submitting" || !leadConsent}>
                    {leadStatus === "submitting" ? t("lead.sending") : t("lead.submit")}
                  </Button>
                </div>

                <label className="mt-4 flex gap-3 rounded-[1rem] border border-[#e5d9c8] bg-white/70 p-3 text-xs leading-5 text-[#6a5846]">
                  <input
                    type="checkbox"
                    checked={leadConsent}
                    onChange={(event) => setLeadConsent(event.target.checked)}
                    className="mt-1 h-4 w-4"
                  />
                  <span>{t("lead.consent")}</span>
                </label>
                {leadMessage ? (
                  <p className={cn("mt-3 text-sm", leadStatus === "success" ? "text-[#1E4B3B]" : "text-[#8a4036]")}>
                    {leadMessage}
                  </p>
                ) : null}
              </form>

              <div className="rounded-[1.6rem] border border-white/12 bg-white/[0.08] p-5 text-[#fff8ed] sm:p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d9b77f]">
                  {t("allResultsEyebrow")}
                </p>
                <div className="mt-5">
                  <PerfumeGrid
                    perfumes={results.slice(3)}
                    cardVariant="finder"
                    layout="list"
                    animateItems
                    itemAnimationKey={`all-${resultAnimationKey}`}
                    injectInFeedAd
                  />
                </div>
                {isLoadingMore ? <p className="mt-4 text-sm text-[#d9c7ab]">{t("finding")}</p> : null}
                {!isLoading && canLoadMore ? <div ref={loadMoreRef} className="h-6 w-full" /> : null}
                {!isLoading && isCatalogLocked ? <CatalogGate previewLimit={FREE_FINDER_PREVIEW_LIMIT} /> : null}
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
