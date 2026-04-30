"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

import { NoteIcon } from "@/components/perfumes/NoteIcons";
import { Button } from "@/components/ui/Button";
import {
  genderOptions,
  priceOptions,
  sortOptions,
  type ParsedPerfumeFilters,
} from "@/lib/filters";
import type { CatalogFilterOption } from "@/lib/perfumes-catalog";
import { getLocalizedTaxonomyLabel } from "@/lib/taxonomy-display";
import { usePathname, useRouter } from "@/lib/navigation";

type PerfumeFiltersProps = {
  selectedFilters: ParsedPerfumeFilters;
  filterOptions: {
    families: CatalogFilterOption[];
    notes: CatalogFilterOption[];
  };
};

export function PerfumeFilters({ selectedFilters, filterOptions }: PerfumeFiltersProps) {
  const t = useTranslations("catalog.filters");
  const taxonomyT = useTranslations("taxonomy");
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [isDesktopLayout, setIsDesktopLayout] = useState(false);
  const filtersPathname = pathname === "/perfumes" ? pathname : "/perfumes";
  const familyFilterOptions = useMemo(
    () =>
      filterOptions.families
        .map((option) => ({
          ...option,
          displayLabel: getLocalizedTaxonomyLabel(option.label, "families", taxonomyT),
        }))
        .sort((a, b) => a.displayLabel.localeCompare(b.displayLabel, undefined, { sensitivity: "base" })),
    [filterOptions.families, taxonomyT],
  );
  const noteFilterOptions = useMemo(
    () =>
      filterOptions.notes
        .map((option) => ({
          ...option,
          displayLabel: getLocalizedTaxonomyLabel(option.value, "notes", taxonomyT),
        }))
        .sort((a, b) => a.displayLabel.localeCompare(b.displayLabel, undefined, { sensitivity: "base" })),
    [filterOptions.notes, taxonomyT],
  );

  const activeFiltersCount = useMemo(() => {
    let count = 0;

    if (selectedFilters.gender) count += 1;
    if (selectedFilters.family) count += 1;
    if (selectedFilters.price) count += 1;
    if (selectedFilters.note) count += 1;
    if (selectedFilters.sort && selectedFilters.sort !== "rating") count += 1;

    return count;
  }, [selectedFilters]);

  const activeNoteFilter = useMemo(() => {
    if (selectedFilters.note) {
      return {
        typeLabel: t("fields.note"),
        value: selectedFilters.note,
      };
    }

    return null;
  }, [selectedFilters.note, t]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const syncLayout = () => setIsDesktopLayout(mediaQuery.matches);

    syncLayout();
    mediaQuery.addEventListener("change", syncLayout);

    return () => mediaQuery.removeEventListener("change", syncLayout);
  }, []);

  const showFilters = isDesktopLayout || isOpen;

  const updateParam = (key: string, value?: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (!value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }

    params.delete("page");

    const query = Object.fromEntries(params.entries());
    const nextHref = (
      params.size > 0 ? { pathname: filtersPathname, query } : filtersPathname
    ) as Parameters<typeof router.push>[0];
    router.push(nextHref);
  };

  const clearFilters = () => {
    router.push(filtersPathname);
  };

  return (
    <aside className="rounded-2xl border border-[#dfd1bf] bg-white p-5 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto">
      {activeNoteFilter ? (
        <div className="mb-4 rounded-[1.7rem] border border-[#ddcfbc] bg-[#faf6ef] p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8b7661]">
            {t("activeSearch")}
          </p>
          <div className="mt-3 flex items-center gap-3 rounded-[1.5rem] border border-[#e6d8c6] bg-white px-3 py-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f6efe5] text-[#9a8266]">
              <NoteIcon slug={activeNoteFilter.value} className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#9a846d]">
                {activeNoteFilter.typeLabel}
              </p>
              <p className="mt-1 font-display text-[1.3rem] leading-[1.02] tracking-[-0.02em] text-[#31251b]">
                {getLocalizedTaxonomyLabel(activeNoteFilter.value, "notes", taxonomyT)}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            if (!isDesktopLayout) {
              setIsOpen((current) => !current);
            }
          }}
          className="flex items-center gap-2 text-left text-sm font-semibold uppercase tracking-[0.1em] text-[#7a6654]"
          aria-expanded={showFilters}
        >
          <span>{t("title")}</span>
          {activeFiltersCount > 0 ? (
            <span className="rounded-full border border-[#ddcfbc] bg-[#f7f1e8] px-2 py-0.5 text-[11px] font-medium normal-case tracking-normal text-[#6b5846]">
              {activeFiltersCount}
            </span>
          ) : null}
          {!isDesktopLayout ? <span className="text-xs">{isOpen ? "▲" : "▼"}</span> : null}
        </button>
        {showFilters ? (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            {t("reset")}
          </Button>
        ) : null}
      </div>

      {!showFilters ? (
        <p className="text-sm text-[#6a5847]">{t("summary")}</p>
      ) : null}

      {showFilters ? <div className="space-y-4">
        <div>
          <label htmlFor="sort" className="mb-2 block text-xs font-medium text-[#6e5a48]">
            {t("fields.sort")}
          </label>
          <select
            id="sort"
            value={selectedFilters.sort ?? "rating"}
            onChange={(event) => updateParam("sort", event.target.value || undefined)}
            className="h-11 w-full rounded-xl border border-[#d8cab7] bg-[#fdfbf7] px-3 text-sm text-[#2a2018] outline-none ring-[#bfa78f] focus:ring-2"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {t(`sortOptions.${option.value}`)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="family" className="mb-2 block text-xs font-medium text-[#6e5a48]">
            {t("fields.family")}
          </label>
          <select
            id="family"
            value={selectedFilters.family ?? ""}
            onChange={(event) => updateParam("family", event.target.value || undefined)}
            className="h-11 w-full rounded-xl border border-[#d8cab7] bg-[#fdfbf7] px-3 text-sm text-[#2a2018] outline-none ring-[#bfa78f] focus:ring-2"
          >
            <option value="">{t("all")}</option>
            {familyFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.displayLabel} ({option.count})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="price" className="mb-2 block text-xs font-medium text-[#6e5a48]">
            {t("fields.price")}
          </label>
          <select
            id="price"
            value={selectedFilters.price ?? ""}
            onChange={(event) => updateParam("price", event.target.value || undefined)}
            className="h-11 w-full rounded-xl border border-[#d8cab7] bg-[#fdfbf7] px-3 text-sm text-[#2a2018] outline-none ring-[#bfa78f] focus:ring-2"
          >
            <option value="">{t("all")}</option>
            {priceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {t(`priceOptions.${option.value}`)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="gender" className="mb-2 block text-xs font-medium text-[#6e5a48]">
            {t("fields.gender")}
          </label>
          <select
            id="gender"
            value={selectedFilters.gender ?? ""}
            onChange={(event) => updateParam("gender", event.target.value || undefined)}
            className="h-11 w-full rounded-xl border border-[#d8cab7] bg-[#fdfbf7] px-3 text-sm text-[#2a2018] outline-none ring-[#bfa78f] focus:ring-2"
          >
            <option value="">{t("all")}</option>
            {genderOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {t(`genderOptions.${option.value}`)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="note" className="mb-2 block text-xs font-medium text-[#6e5a48]">
            {t("fields.note")}
          </label>
          <select
            id="note"
            value={selectedFilters.note ?? ""}
            onChange={(event) => updateParam("note", event.target.value || undefined)}
            className="h-11 w-full rounded-xl border border-[#d8cab7] bg-[#fdfbf7] px-3 text-sm text-[#2a2018] outline-none ring-[#bfa78f] focus:ring-2"
          >
            <option value="">{t("any")}</option>
            {noteFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.displayLabel} ({option.count})
              </option>
            ))}
          </select>
        </div>
      </div> : null}
    </aside>
  );
}
