import type { Metadata } from "next";
import { getMessages, getTranslations } from "next-intl/server";

import { LegalPage } from "@/components/legal/LegalPage";
import { hasLocale } from "@/lib/i18n";
import { buildPageMetadata } from "@/lib/metadata";

type CookiePolicyPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({ params }: CookiePolicyPageProps): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = hasLocale(locale) ? locale : "en";
  const t = await getTranslations({ locale: resolvedLocale, namespace: "metadata.pages.cookiePolicy" });

  return buildPageMetadata({
    title: t("title"),
    description: t("description"),
    locale: resolvedLocale,
    pathname: "/cookie-policy",
  });
}

export default async function CookiePolicyPage() {
  const messages = await getMessages();
  const content = (
    messages as {
      legal: {
        common: {
          relatedLinks: {
            privacyPolicy: string;
          };
        };
        cookiePolicy: Parameters<typeof LegalPage>[0];
      };
    }
  ).legal;

  return (
    <LegalPage
      eyebrow={content.cookiePolicy.eyebrow}
      title={content.cookiePolicy.title}
      intro={content.cookiePolicy.intro}
      effectiveDate={content.cookiePolicy.effectiveDate}
      sections={content.cookiePolicy.sections}
      relatedLinks={[{ href: "/privacy", label: content.common.relatedLinks.privacyPolicy }]}
    />
  );
}
