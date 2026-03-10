"use client";

import { useMemo, useState } from "react";

import { PerfumeGrid } from "@/components/perfumes/PerfumeGrid";
import { Button } from "@/components/ui/Button";
import {
  type FinderPerfume,
  type FinderPreferences,
  matchPerfumesFromPreferences,
} from "@/lib/finder";

type FinderExperienceProps = {
  perfumes: FinderPerfume[];
};

function toLabel(slug: string) {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const initialPreferences: FinderPreferences = {
  gender: "any",
  mood: "",
  season: "",
  budget: "any",
  preferredNote: "",
  arabicOnly: false,
  nicheOnly: false,
};

export function FinderExperience({ perfumes }: FinderExperienceProps) {
  const [preferences, setPreferences] = useState<FinderPreferences>(initialPreferences);
  const [results, setResults] = useState<FinderPerfume[]>([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const moodOptions = useMemo(
    () =>
      Array.from(
        new Set(
          perfumes.flatMap((perfume) =>
            (perfume.moods ?? []).map((mood) => mood.mood?.slug).filter((slug): slug is string => Boolean(slug)),
          ),
        ),
      ).sort(),
    [perfumes],
  );

  const seasonOptions = useMemo(
    () =>
      Array.from(
        new Set(
          perfumes.flatMap((perfume) =>
            (perfume.seasons ?? [])
              .map((season) => season.season?.slug)
              .filter((slug): slug is string => Boolean(slug)),
          ),
        ),
      ).sort(),
    [perfumes],
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

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([slug]) => slug)
      .slice(0, 14);
  }, [perfumes]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/finder", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(preferences),
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Finder request failed with status ${response.status}`);
      }

      const payload = (await response.json()) as {
        results: FinderPerfume[];
        total: number;
      };

      setResults(payload.results ?? []);
      setTotalMatches(payload.total ?? (payload.results ?? []).length);
      setSubmitted(true);
    } catch {
      const fallbackResults = matchPerfumesFromPreferences(preferences, perfumes);
      setResults(fallbackResults);
      setTotalMatches(fallbackResults.length);
      setSubmitted(true);
      setErrorMessage("Finder service temporarily unavailable. Showing fallback results.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setPreferences(initialPreferences);
    setResults([]);
    setTotalMatches(0);
    setSubmitted(false);
    setErrorMessage(null);
    setIsLoading(false);
  };

  return (
    <div className="space-y-8">
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
          <PerfumeGrid perfumes={results} />
        </section>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#d8c9b6] bg-[#fbf7f0] p-8 text-sm text-[#655444]">
          Select your preferences and run the finder to see your best perfume matches.
        </div>
      )}
    </div>
  );
}
