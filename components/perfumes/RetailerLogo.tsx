"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";

type RetailerLogoProps = {
  storeName: string;
  className?: string;
  imageClassName?: string;
  showName?: boolean;
  nameClassName?: string;
  align?: "left" | "center";
  surface?: "none" | "pill";
  size?: "sm" | "md";
};

const LOGO_MAP = [
  {
    match: "amazon",
    src: "/images/logo_amazon.webp",
    width: 110,
    height: 33,
    imageClassName: "w-[74px] translate-y-[1px]",
  },
  {
    match: "notino",
    src: "/images/notino_logo.png",
    width: 112,
    height: 47,
    imageClassName: "w-[90px]",
  },
  {
    match: "douglas",
    src: "/images/Douglas_Logo.png",
    width: 128,
    height: 24,
    imageClassName: "w-[84px]",
  },
  {
    match: "sephora",
    src: "/images/Sephora_logo.png",
    width: 128,
    height: 17,
    imageClassName: "w-[86px]",
  },
] as const;

const SIZE_STYLES = {
  sm: {
    pill: "min-h-9 px-3 py-1.5",
    image: "max-h-[18px]",
  },
  md: {
    pill: "min-h-10 px-4 py-2",
    image: "max-h-5",
  },
} as const;

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
  surface = "none",
  size = "md",
}: RetailerLogoProps) {
  const logo = getRetailerLogo(storeName);
  const sizeStyles = SIZE_STYLES[size];

  if (!logo) {
    return (
      <span
        className={cn(
          surface === "pill"
            ? "inline-flex min-h-10 items-center rounded-full border border-[#ddcfbc] bg-white/88 px-4 py-2 text-sm text-[#2a2018] shadow-[0_14px_24px_-22px_rgba(56,40,25,0.45)]"
            : "text-sm text-[#2a2018]",
          className,
        )}
      >
        {storeName}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-2 whitespace-nowrap",
        surface === "pill"
          ? cn(
              "rounded-full border border-[#ddcfbc] bg-white/88 shadow-[0_14px_24px_-22px_rgba(56,40,25,0.45)]",
              sizeStyles.pill,
            )
          : null,
        className,
      )}
    >
      <span
        className={cn(
          "inline-flex max-w-full items-center overflow-visible",
          align === "center" ? "justify-center" : "justify-start",
        )}
      >
        <Image
          src={logo.src}
          alt={storeName}
          width={logo.width}
          height={logo.height}
          className={cn(
            "h-auto w-auto object-contain",
            align === "center" ? "object-center" : "object-left",
            sizeStyles.image,
            logo.imageClassName,
            imageClassName,
          )}
          loading="lazy"
        />
      </span>
      {showName ? <span className={nameClassName}>{storeName}</span> : null}
    </span>
  );
}
