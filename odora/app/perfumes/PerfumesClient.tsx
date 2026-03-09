"use client";

import { useMemo, useState } from "react";

import { PerfumeFilters } from "@/components/perfumes/PerfumeFilters";
import { PerfumeGrid } from "@/components/perfumes/PerfumeGrid";
import type { PerfumeCardItem } from "@/components/perfumes/PerfumeCard";

type PerfumesClientProps = {
  perfumes: PerfumeCardItem[];
};

export function PerfumesClient({ perfumes }: PerfumesClientProps) {
  const [search, setSearch] = useState("");
  const [gender, setGender] = useState("all");
  const [fragranceFamily, setFragranceFamily] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [arabicOnly, setArabicOnly] = useState(false);
  const [nicheOnly, setNicheOnly] = useState(false);

  const genderOptions = useMemo(
    () => Array.from(new Set(perfumes.map((perfume) => perfume.gender))).sort(),
    [perfumes],
  );

  const familyOptions = useMemo(
    () => Array.from(new Set(perfumes.map((perfume) => perfume.fragranceFamily))).sort(),
    [perfumes],
  );

  const priceRangeOptions = useMemo(
    () => Array.from(new Set(perfumes.map((perfume) => perfume.priceRange))).sort(),
    [perfumes],
  );

  const filteredPerfumes = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return perfumes.filter((perfume) => {
      if (
        normalizedSearch &&
        ![
          perfume.name.toLowerCase(),
          perfume.brand.name.toLowerCase(),
          perfume.descriptionShort.toLowerCase(),
        ].some((text) => text.includes(normalizedSearch))
      ) {
        return false;
      }

      if (gender !== "all" && perfume.gender !== gender) {
        return false;
      }

      if (fragranceFamily !== "all" && perfume.fragranceFamily !== fragranceFamily) {
        return false;
      }

      if (priceRange !== "all" && perfume.priceRange !== priceRange) {
        return false;
      }

      if (arabicOnly && !perfume.isArabic) {
        return false;
      }

      if (nicheOnly && !perfume.isNiche) {
        return false;
      }

      return true;
    });
  }, [arabicOnly, fragranceFamily, gender, nicheOnly, perfumes, priceRange, search]);

  const clearFilters = () => {
    setSearch("");
    setGender("all");
    setFragranceFamily("all");
    setPriceRange("all");
    setArabicOnly(false);
    setNicheOnly(false);
  };

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
      <PerfumeFilters
        search={search}
        onSearchChange={setSearch}
        gender={gender}
        onGenderChange={setGender}
        fragranceFamily={fragranceFamily}
        onFragranceFamilyChange={setFragranceFamily}
        priceRange={priceRange}
        onPriceRangeChange={setPriceRange}
        arabicOnly={arabicOnly}
        onArabicOnlyChange={setArabicOnly}
        nicheOnly={nicheOnly}
        onNicheOnlyChange={setNicheOnly}
        genderOptions={genderOptions}
        familyOptions={familyOptions}
        priceRangeOptions={priceRangeOptions}
        onClear={clearFilters}
      />

      <section className="space-y-4">
        <p className="text-sm text-[#615140]">
          Showing <span className="font-semibold text-[#2a2018]">{filteredPerfumes.length}</span> perfumes
        </p>
        <PerfumeGrid perfumes={filteredPerfumes} />
      </section>
    </div>
  );
}
