"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";

type RetailerLogoProps = {
  storeName: string;
  className?: string;
  imageClassName?: string;
  showName?: boolean;
  nameClassName?: string;
};

const LOGO_MAP = [
  { match: "amazon", src: "/images/logo_amazon.webp", width: 92, height: 28 },
  { match: "notino", src: "/images/notino_logo.png", width: 92, height: 28 },
  { match: "douglas", src: "/images/Douglas_Logo.png", width: 92, height: 28 },
  { match: "sephora", src: "/images/Sephora_logo.png", width: 92, height: 28 },
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
}: RetailerLogoProps) {
  const logo = getRetailerLogo(storeName);

  if (!logo) {
    return <span className={className}>{storeName}</span>;
  }

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Image
        src={logo.src}
        alt={storeName}
        width={logo.width}
        height={logo.height}
        className={cn("h-5 w-auto object-contain", imageClassName)}
      />
      {showName ? <span className={nameClassName}>{storeName}</span> : null}
    </span>
  );
}
