"use client";

import { Button } from "@/components/ui/Button";
import { formatGender, formatPriceRange } from "@/lib/utils";

type PerfumeFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  gender: string;
  onGenderChange: (value: string) => void;
  fragranceFamily: string;
  onFragranceFamilyChange: (value: string) => void;
  priceRange: string;
  onPriceRangeChange: (value: string) => void;
  arabicOnly: boolean;
  onArabicOnlyChange: (value: boolean) => void;
  nicheOnly: boolean;
  onNicheOnlyChange: (value: boolean) => void;
  genderOptions: string[];
  familyOptions: string[];
  priceRangeOptions: string[];
  onClear: () => void;
};

export function PerfumeFilters({
  search,
  onSearchChange,
  gender,
  onGenderChange,
  fragranceFamily,
  onFragranceFamilyChange,
  priceRange,
  onPriceRangeChange,
  arabicOnly,
  onArabicOnlyChange,
  nicheOnly,
  onNicheOnlyChange,
  genderOptions,
  familyOptions,
  priceRangeOptions,
  onClear,
}: PerfumeFiltersProps) {
  return (
    <aside className="rounded-2xl border border-[#dfd1bf] bg-white p-5 lg:sticky lg:top-24 lg:h-fit">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-[#7a6654]">Filters</h2>
        <Button variant="ghost" size="sm" onClick={onClear}>
          Reset
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="search" className="mb-2 block text-xs font-medium text-[#6e5a48]">
            Search
          </label>
          <input
            id="search"
            type="text"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Name or brand"
            className="h-11 w-full rounded-xl border border-[#d8cab7] bg-[#fdfbf7] px-3 text-sm text-[#2a2018] outline-none ring-[#bfa78f] focus:ring-2"
          />
        </div>

        <div>
          <label htmlFor="gender" className="mb-2 block text-xs font-medium text-[#6e5a48]">
            Gender
          </label>
          <select
            id="gender"
            value={gender}
            onChange={(event) => onGenderChange(event.target.value)}
            className="h-11 w-full rounded-xl border border-[#d8cab7] bg-[#fdfbf7] px-3 text-sm text-[#2a2018] outline-none ring-[#bfa78f] focus:ring-2"
          >
            <option value="all">All</option>
            {genderOptions.map((option) => (
              <option key={option} value={option}>
                {formatGender(option)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="family" className="mb-2 block text-xs font-medium text-[#6e5a48]">
            Fragrance Family
          </label>
          <select
            id="family"
            value={fragranceFamily}
            onChange={(event) => onFragranceFamilyChange(event.target.value)}
            className="h-11 w-full rounded-xl border border-[#d8cab7] bg-[#fdfbf7] px-3 text-sm text-[#2a2018] outline-none ring-[#bfa78f] focus:ring-2"
          >
            <option value="all">All</option>
            {familyOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="price" className="mb-2 block text-xs font-medium text-[#6e5a48]">
            Price Range
          </label>
          <select
            id="price"
            value={priceRange}
            onChange={(event) => onPriceRangeChange(event.target.value)}
            className="h-11 w-full rounded-xl border border-[#d8cab7] bg-[#fdfbf7] px-3 text-sm text-[#2a2018] outline-none ring-[#bfa78f] focus:ring-2"
          >
            <option value="all">All</option>
            {priceRangeOptions.map((option) => (
              <option key={option} value={option}>
                {formatPriceRange(option)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-3 pt-1">
          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-[#dfd1bf] px-3 py-2">
            <span className="text-sm text-[#2a2018]">Arabic only</span>
            <input
              type="checkbox"
              checked={arabicOnly}
              onChange={(event) => onArabicOnlyChange(event.target.checked)}
              className="h-4 w-4 rounded border-[#b89f85]"
            />
          </label>

          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-[#dfd1bf] px-3 py-2">
            <span className="text-sm text-[#2a2018]">Niche only</span>
            <input
              type="checkbox"
              checked={nicheOnly}
              onChange={(event) => onNicheOnlyChange(event.target.checked)}
              className="h-4 w-4 rounded border-[#b89f85]"
            />
          </label>
        </div>
      </div>
    </aside>
  );
}
