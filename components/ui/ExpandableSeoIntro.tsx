"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";

import { buttonStyles } from "@/components/ui/Button";
import { SectionTitle } from "@/components/ui/SectionTitle";
import type { AppPathname } from "@/lib/i18n";
import { Link } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type SeoIntroPathname = Exclude<AppPathname, "/perfumes/[slug]" | "/blog/[slug]" | "/brands/[slug]" | "/lists/[listKey]" | "/users/[userId]">;

type SeoIntroCta = {
  href: SeoIntroPathname;
  label: string;
  variant?: "primary" | "secondary";
};

type ExpandableSeoIntroProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  body: string[];
  primaryCta: SeoIntroCta;
  secondaryCta?: SeoIntroCta;
  headingAs?: "h1" | "h2" | "h3";
};

export function ExpandableSeoIntro({
  eyebrow,
  title,
  subtitle,
  body,
  primaryCta,
  secondaryCta,
  headingAs = "h1",
}: ExpandableSeoIntroProps) {
  const t = useTranslations("common.actions");
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();
  const visibleBody = body.filter((paragraph) => paragraph.trim().length > 0);
  const hasBody = visibleBody.length > 0;

  return (
    <div>
      <SectionTitle as={headingAs} eyebrow={eyebrow} title={title} />

      {subtitle ? (
        <p className="mt-2 max-w-2xl text-sm text-[#685848]">
          {subtitle}
          {hasBody ? (
            <>
              {" "}
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={contentId}
                onClick={() => setExpanded((current) => !current)}
                className="inline font-medium text-[#6a5848] underline decoration-[#cbb89f] underline-offset-4 transition-colors hover:text-[#1f1914]"
              >
                {expanded ? t("showLess") : t("showMore")}
              </button>
            </>
          ) : null}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-3">
        <Link
          href={primaryCta.href}
          className={buttonStyles({ size: "sm", variant: primaryCta.variant ?? "primary" })}
        >
          {primaryCta.label}
        </Link>
        {secondaryCta ? (
          <Link
            href={secondaryCta.href}
            className={buttonStyles({ size: "sm", variant: secondaryCta.variant ?? "secondary" })}
          >
            {secondaryCta.label}
          </Link>
        ) : null}
      </div>

      {hasBody ? (
        <div
          id={contentId}
          className={cn(
            "max-w-3xl overflow-hidden transition-[max-height,opacity,margin] duration-300 ease-out",
            expanded ? "mt-4 max-h-[24rem] opacity-100" : "max-h-0 opacity-0",
          )}
        >
          <div className="space-y-3 text-sm leading-7 text-[#5f5041] sm:text-base">
            {visibleBody.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
