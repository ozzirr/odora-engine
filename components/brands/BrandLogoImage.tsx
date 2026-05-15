"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

type BrandLogoImageProps = {
  alt: string;
  src: string | null | undefined;
  className?: string;
  fallbackClassName?: string;
  loading?: "eager" | "lazy";
};

export function BrandLogoImage({
  alt,
  src,
  className,
  fallbackClassName,
  loading = "lazy",
}: BrandLogoImageProps) {
  const [hasFailed, setHasFailed] = useState(false);
  const firstLetter = alt.trim().charAt(0) || "?";

  if (!src || hasFailed) {
    return (
      <span className={cn("font-display text-2xl text-[#8b735d]", fallbackClassName)}>
        {firstLetter}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      onError={() => setHasFailed(true)}
    />
  );
}
