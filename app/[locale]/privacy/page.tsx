import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { LegalPage } from "@/components/legal/LegalPage";
import { hasLocale } from "@/lib/i18n";
import { getScopedMessages } from "@/lib/messages";
import { buildPageMetadata } from "@/lib/metadata";

type PrivacyPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({ params }: PrivacyPageProps): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = hasLocale(locale) ? locale : "en";
  const t = await getTranslations({ locale: resolvedLocale, namespace: "metadata.pages.privacy" });

  return buildPageMetadata({
    title: t("title"),
    description: t("description"),
    locale: resolvedLocale,
    pathname: "/privacy",
  });
}

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { locale } = await params;
  const resolvedLocale = hasLocale(locale) ? locale : "en";
  const messages = await getScopedMessages(resolvedLocale, ["legal"]);
  const content = (
    messages as unknown as {
      legal: {
        common: {
          relatedLinks: {
            cookiePolicy: string;
          };
        };
        privacy: Parameters<typeof LegalPage>[0];
      };
    }
  ).legal;

  return (
    <LegalPage
      eyebrow={content.privacy.eyebrow}
      title={content.privacy.title}
      intro={content.privacy.intro}
      effectiveDate={content.privacy.effectiveDate}
      sections={content.privacy.sections}
      relatedLinks={[{ href: "/cookie-policy", label: content.common.relatedLinks.cookiePolicy }]}
    />
  );
}
