import type { Metadata } from "next";
import { getMessages, getTranslations } from "next-intl/server";

import { LegalPage } from "@/components/legal/LegalPage";
import { getAlternateLinks, hasLocale } from "@/lib/i18n";

type TermsPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({ params }: TermsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = hasLocale(locale) ? locale : "en";
  const t = await getTranslations({ locale: resolvedLocale, namespace: "metadata.pages.terms" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: getAlternateLinks("/terms")[resolvedLocale],
      languages: getAlternateLinks("/terms"),
    },
  };
}

export default async function TermsPage() {
  const messages = await getMessages();
  const content = (messages as { legal: { terms: Parameters<typeof LegalPage>[0] } }).legal.terms;

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
