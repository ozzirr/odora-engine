import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "soft" | "outline";

type BadgeProps = {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
};

const badgeVariantClasses: Record<BadgeVariant, string> = {
  default: "bg-[#1e1813] text-[#f8f4ed]",
  soft: "bg-[#f0e8dc] text-[#3a2d22]",
  outline: "border border-[#ddd0be] text-[#4a3c2e]",
};

export function Badge({ children, variant = "soft", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-[0.01em]",
        badgeVariantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
