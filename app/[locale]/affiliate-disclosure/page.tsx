import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { LegalPage } from "@/components/legal/LegalPage";
import { hasLocale } from "@/lib/i18n";
import { getScopedMessages } from "@/lib/messages";
import { buildPageMetadata } from "@/lib/metadata";

type AffiliateDisclosurePageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({ params }: AffiliateDisclosurePageProps): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = hasLocale(locale) ? locale : "en";
  const t = await getTranslations({
    locale: resolvedLocale,
    namespace: "metadata.pages.affiliateDisclosure",
  });

  return buildPageMetadata({
    title: t("title"),
    description: t("description"),
    locale: resolvedLocale,
    pathname: "/affiliate-disclosure",
  });
}

export default async function AffiliateDisclosurePage({ params }: AffiliateDisclosurePageProps) {
  const { locale } = await params;
  const resolvedLocale = hasLocale(locale) ? locale : "en";
  const messages = await getScopedMessages(resolvedLocale, ["legal"]);
  const content = (messages as unknown as { legal: { affiliateDisclosure: Parameters<typeof LegalPage>[0] } }).legal.affiliateDisclosure;

  return (
    <LegalPage
      eyebrow={content.eyebrow}
      title={content.title}
      intro={content.intro}
      effectiveDate={content.effectiveDate}
      sections={content.sections}
    />
  );
}
