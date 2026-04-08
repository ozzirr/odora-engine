import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { LegalPage } from "@/components/legal/LegalPage";
import { hasLocale } from "@/lib/i18n";
import { getScopedMessages } from "@/lib/messages";
import { buildPageMetadata } from "@/lib/metadata";

type TermsPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({ params }: TermsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = hasLocale(locale) ? locale : "en";
  const t = await getTranslations({ locale: resolvedLocale, namespace: "metadata.pages.terms" });

  return buildPageMetadata({
    title: t("title"),
    description: t("description"),
    locale: resolvedLocale,
    pathname: "/terms",
  });
}

export default async function TermsPage({ params }: TermsPageProps) {
  const { locale } = await params;
  const resolvedLocale = hasLocale(locale) ? locale : "en";
  const messages = await getScopedMessages(resolvedLocale, ["legal"]);
  const content = (messages as unknown as { legal: { terms: Parameters<typeof LegalPage>[0] } }).legal.terms;

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
