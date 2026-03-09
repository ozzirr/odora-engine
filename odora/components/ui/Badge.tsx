import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "soft" | "outline";

type BadgeProps = {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
};

const badgeVariantClasses: Record<BadgeVariant, string> = {
  default: "bg-[#1f1914] text-[#f8f4ed]",
  soft: "bg-[#ece4d8] text-[#2c231b]",
  outline: "border border-[#d7c9b5] text-[#3a2d22]",
};

export function Badge({ children, variant = "soft", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        badgeVariantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
