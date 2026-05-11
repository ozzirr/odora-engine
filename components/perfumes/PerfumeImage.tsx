import Image from "next/image";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

type PerfumeImageProps = {
  imageUrl: string | null;
  perfumeName: string;
  brandName: string;
  fragranceFamily?: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  imageClassName?: string;
};

const ALLOWED_EXTERNAL_IMAGE_HOSTS = new Set([
  "rmnbfnaapibtyfxuacde.supabase.co",
  "media.parfumo.com",
  "fimgs.net",
]);

function isRenderableImageUrl(value: string | null | undefined) {
  const raw = value?.trim();
  if (!raw) {
    return false;
  }

  if (raw.startsWith("/")) {
    return true;
  }

  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }

    return ALLOWED_EXTERNAL_IMAGE_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

function PerfumeImageFallback({
  brandName,
  perfumeName,
  fragranceFamily,
}: {
  brandName: string;
  perfumeName: string;
  fragranceFamily?: string;
}) {
  const t = useTranslations("perfume.image");

  return (
    <div className="relative h-full w-full overflow-hidden bg-[radial-gradient(circle_at_18%_16%,#fffefc_0%,#f5ede2_40%,#e8ddce_100%)]">
      <div className="absolute -left-12 top-10 h-40 w-40 rounded-full bg-white/35 blur-3xl" />
      <div className="absolute -right-12 bottom-4 h-44 w-44 rounded-full bg-[#d9c8b2]/35 blur-3xl" />
      <div className="absolute left-1/2 top-1/2 h-[72%] w-[45%] -translate-x-1/2 -translate-y-1/2 rounded-[2.3rem] border border-[#d8c6b0] bg-[#fbf5ec]/85 shadow-[0_26px_38px_-26px_rgba(71,52,34,0.52)]" />

      <div className="relative z-10 flex h-full flex-col justify-between px-5 py-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#806e5a]">{brandName}</p>

        <div className="space-y-2">
          <p className="font-display text-2xl leading-tight text-[#271d15] sm:text-3xl">{perfumeName}</p>
          {fragranceFamily ? (
            <span className="inline-flex rounded-full border border-[#d4c0aa] bg-[#fbf5ec]/90 px-3 py-1 text-xs uppercase tracking-[0.1em] text-[#715f4c]">
              {fragranceFamily}
            </span>
          ) : null}
        </div>

        <p className="text-xs uppercase tracking-[0.12em] text-[#8f7c68]">{t("selection")}</p>
      </div>
    </div>
  );
}

export function PerfumeImage({
  imageUrl,
  perfumeName,
  brandName,
  fragranceFamily,
  sizes,
  priority = false,
  className,
  imageClassName,
}: PerfumeImageProps) {
  const normalizedUrl = isRenderableImageUrl(imageUrl) ? imageUrl!.trim() : null;

  return (
    <div className={cn("relative h-full w-full", className)}>
      {normalizedUrl ? (
        <Image
          src={normalizedUrl}
          alt={perfumeName}
          fill
          priority={priority}
          sizes={sizes}
          className={cn("object-cover", imageClassName)}
        />
      ) : (
        <PerfumeImageFallback
          brandName={brandName}
          perfumeName={perfumeName}
          fragranceFamily={fragranceFamily}
        />
      )}
    </div>
  );
}
