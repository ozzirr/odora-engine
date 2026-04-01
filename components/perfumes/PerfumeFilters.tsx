"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/Button";
import {
  familyOptions,
  genderOptions,
  noteFilterOptions,
  priceOptions,
  sortOptions,
  type ParsedPerfumeFilters,
} from "@/lib/filters";
import { usePathname, useRouter } from "@/lib/navigation";

type PerfumeFiltersProps = {
  selectedFilters: ParsedPerfumeFilters;
};

export function PerfumeFilters({ selectedFilters }: PerfumeFiltersProps) {
  const t = useTranslations("catalog.filters");
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [isDesktopLayout, setIsDesktopLayout] = useState(false);
  const filtersPathname = pathname === "/perfumes" ? pathname : "/perfumes";

  const activeFiltersCount = useMemo(() => {
    let count = 0;

    if (selectedFilters.gender) count += 1;
    if (selectedFilters.family) count += 1;
    if (selectedFilters.price) count += 1;
    if (selectedFilters.note) count += 1;
    if (selectedFilters.top) count += 1;
    if (selectedFilters.heart) count += 1;
    if (selectedFilters.base) count += 1;
    if (selectedFilters.arabic) count += 1;
    if (selectedFilters.niche) count += 1;
    if (selectedFilters.sort && selectedFilters.sort !== "rating") count += 1;

    return count;
  }, [selectedFilters]);

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
            {familyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {t(`familyOptions.${option.value}`)}
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

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <div>
            <label htmlFor="top" className="mb-2 block text-xs font-medium text-[#6e5a48]">
              {t("fields.top")}
            </label>
            <select
              id="top"
              value={selectedFilters.top ?? ""}
              onChange={(event) => updateParam("top", event.target.value || undefined)}
              className="h-11 w-full rounded-xl border border-[#d8cab7] bg-[#fdfbf7] px-3 text-sm text-[#2a2018] outline-none ring-[#bfa78f] focus:ring-2"
            >
              <option value="">{t("any")}</option>
              {noteFilterOptions.map((option) => (
                <option key={`top-${option.value}`} value={option.value}>
                  {t(`noteOptions.${option.value}`)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="heart" className="mb-2 block text-xs font-medium text-[#6e5a48]">
              {t("fields.heart")}
            </label>
            <select
              id="heart"
              value={selectedFilters.heart ?? ""}
              onChange={(event) => updateParam("heart", event.target.value || undefined)}
              className="h-11 w-full rounded-xl border border-[#d8cab7] bg-[#fdfbf7] px-3 text-sm text-[#2a2018] outline-none ring-[#bfa78f] focus:ring-2"
            >
              <option value="">{t("any")}</option>
              {noteFilterOptions.map((option) => (
                <option key={`heart-${option.value}`} value={option.value}>
                  {t(`noteOptions.${option.value}`)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="base" className="mb-2 block text-xs font-medium text-[#6e5a48]">
              {t("fields.base")}
            </label>
            <select
              id="base"
              value={selectedFilters.base ?? ""}
              onChange={(event) => updateParam("base", event.target.value || undefined)}
              className="h-11 w-full rounded-xl border border-[#d8cab7] bg-[#fdfbf7] px-3 text-sm text-[#2a2018] outline-none ring-[#bfa78f] focus:ring-2"
            >
              <option value="">{t("any")}</option>
              {noteFilterOptions.map((option) => (
                <option key={`base-${option.value}`} value={option.value}>
                  {t(`noteOptions.${option.value}`)}
                </option>
              ))}
            </select>
          </div>
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
          <input
            id="note"
            value={selectedFilters.note ?? ""}
            onChange={(event) => updateParam("note", event.target.value || undefined)}
            placeholder={t("notePlaceholder")}
            className="h-11 w-full rounded-xl border border-[#d8cab7] bg-[#fdfbf7] px-3 text-sm text-[#2a2018] outline-none ring-[#bfa78f] focus:ring-2"
          />
        </div>

        <div className="space-y-3 pt-1">
          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-[#dfd1bf] px-3 py-2">
            <span className="text-sm text-[#2a2018]">{t("arabicOnly")}</span>
            <input
              type="checkbox"
              checked={selectedFilters.arabic === true}
              onChange={(event) => updateParam("arabic", event.target.checked ? "true" : undefined)}
              className="h-4 w-4 rounded border-[#b89f85]"
            />
          </label>

          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-[#dfd1bf] px-3 py-2">
            <span className="text-sm text-[#2a2018]">{t("nicheOnly")}</span>
            <input
              type="checkbox"
              checked={selectedFilters.niche === true}
              onChange={(event) => updateParam("niche", event.target.checked ? "true" : undefined)}
              className="h-4 w-4 rounded border-[#b89f85]"
            />
          </label>
        </div>
      </div> : null}
    </aside>
  );
}
