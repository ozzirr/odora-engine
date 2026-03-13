"use client";

import { cn } from "@/lib/utils";

type RetailerLogoProps = {
  storeName: string;
  className?: string;
  imageClassName?: string;
  showName?: boolean;
  nameClassName?: string;
  align?: "left" | "center";
};

const LOGO_MAP = [
  {
    match: "amazon",
    src: "/images/logo_amazon.webp",
    width: 92,
    height: 28,
    imageClassName: "w-[72px] translate-y-[1px]",
  },
  {
    match: "notino",
    src: "/images/notino_logo.png?v=20260312-1821",
    width: 92,
    height: 28,
    imageClassName: "w-[92px] scale-[1.55] origin-center",
  },
  {
    match: "douglas",
    src: "/images/Douglas_Logo.png",
    width: 92,
    height: 28,
    imageClassName: "w-[82px]",
  },
  {
    match: "sephora",
    src: "/images/Sephora_logo.png",
    width: 92,
    height: 28,
    imageClassName: "w-[84px]",
  },
] as const;

function getRetailerLogo(storeName: string) {
  const normalizedName = storeName.trim().toLowerCase();
  return LOGO_MAP.find((entry) => normalizedName.includes(entry.match)) ?? null;
}

export function RetailerLogo({
  storeName,
  className,
  imageClassName,
  showName = false,
  nameClassName,
  align = "left",
}: RetailerLogoProps) {
  const logo = getRetailerLogo(storeName);

  if (!logo) {
    return <span className={className}>{storeName}</span>;
  }

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn(
          "inline-flex w-[96px] items-center overflow-visible",
          align === "center" ? "justify-center" : "justify-start",
        )}
      >
        <img
          src={logo.src}
          alt={storeName}
          width={logo.width}
          height={logo.height}
          className={cn(
            "h-5 object-contain",
            align === "center" ? "object-center" : "object-left",
            logo.imageClassName,
            imageClassName,
          )}
          loading="lazy"
          decoding="async"
        />
      </span>
      {showName ? <span className={nameClassName}>{storeName}</span> : null}
    </span>
  );
}
