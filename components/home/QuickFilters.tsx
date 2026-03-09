import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { quickFilters } from "@/lib/sample-data";

export function QuickFilters() {
  return (
    <section className="mt-16 space-y-6">
      <SectionTitle
        eyebrow="Quick Start"
        title="Explore by mood and style"
        subtitle="These shortcuts are ideal for quick discovery before using the full advisor flow."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {quickFilters.map((filter) => (
          <Link
            key={filter.label}
            href={filter.href}
            className="rounded-2xl border border-[#e2d6c6] bg-white p-4 transition-transform hover:-translate-y-0.5"
          >
            <p className="text-sm font-semibold text-[#1f1914]">{filter.label}</p>
            <div className="mt-2">
              <Badge variant="outline">{filter.tone}</Badge>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
