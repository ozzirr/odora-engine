"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";

import { buttonStyles } from "@/components/ui/Button";
import { type AppLocale } from "@/lib/i18n";
import { getAmazonProductUrl } from "@/lib/amazon";
import { cn } from "@/lib/utils";

type AmazonCalloutCardProps = {
  perfumeName: string;
  brandName?: string | null;
  amazonUrl?: string | null;
  perfumeSlug?: string | null;
  className?: string;
};

function AmazonWordmark({ className }: { className?: string }) {
  return (
    <Image
      src="/images/logo_amazon.webp"
      alt="Amazon"
      width={110}
      height={34}
      className={cn("brightness-0 invert", className)}
    />
  );
}

export function AmazonCalloutCard({
  perfumeName,
  brandName,
  amazonUrl,
  perfumeSlug,
  className,
}: AmazonCalloutCardProps) {
  const t = useTranslations("perfume.amazon");
  const locale = useLocale() as AppLocale;
  const targetUrl = getAmazonProductUrl({ amazonUrl, brandName, perfumeName, locale, perfumeSlug });

  return (
    <section
      className={cn(
        "rounded-[28px] border border-[#f1d19b] bg-[linear-gradient(135deg,#fff9ef_0%,#fff2d5_55%,#fde4b8_100%)] p-6 shadow-[0_20px_50px_-36px_rgba(88,52,8,0.48)]",
        className,
      )}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#92631b]">{t("eyebrow")}</p>
            <h2 className="font-display text-2xl text-[#23170c] sm:text-[2rem]">{t("title")}</h2>
            <p className="max-w-2xl text-sm text-[#5b4630]">{t("subtitle")}</p>
          </div>
        </div>

        <a
          href={targetUrl}
          target="_blank"
          rel="noreferrer"
          className={buttonStyles({
            className:
              "h-12 w-full min-w-[200px] bg-[#ffb647] !text-[#23170c] hover:bg-[#f0a62f] hover:!text-[#23170c] lg:w-auto lg:px-6",
          })}
        >
          <span className="inline-flex items-center gap-2">
            <span>{t("ctaPrefix")}</span>
            <span className="inline-flex min-w-[86px] items-center justify-center">
              <AmazonWordmark className="h-[22px] w-auto object-contain translate-y-[1px]" />
            </span>
          </span>
        </a>
      </div>
    </section>
  );
}
