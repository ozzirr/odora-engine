import type { ComponentProps } from "react";

import { Link } from "@/lib/navigation";

type BreadcrumbHref = ComponentProps<typeof Link>["href"];

type BreadcrumbItem = {
  label: string;
  href?: BreadcrumbHref;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
  className?: string;
};

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={className}
    >
      <ol className="flex flex-wrap items-center gap-2 text-sm text-[#7a6654]">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {item.href && !isLast ? (
                <Link href={item.href} className="transition-colors hover:text-[#2a2018]">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? "font-medium text-[#2a2018]" : undefined}>{item.label}</span>
              )}
              {!isLast ? <span aria-hidden="true">/</span> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
