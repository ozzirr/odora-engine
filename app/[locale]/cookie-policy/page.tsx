import type { Metadata } from "next";
import { getMessages } from "next-intl/server";

import { LegalPage } from "@/components/legal/LegalPage";
import { cookiePolicyContent } from "@/lib/privacy/cookie-policy";
import { getAlternateLinks, hasLocale } from "@/lib/i18n";

type CookiePolicyPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({ params }: CookiePolicyPageProps): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = hasLocale(locale) ? locale : "it";

  return {
    title: "Cookie Policy | Odora",
    description:
      "Informazioni chiare sui cookie tecnici, sulle sessioni Supabase e sugli analytics privacy-friendly attivi su Odora.",
    alternates: {
      canonical: getAlternateLinks("/cookie-policy")[resolvedLocale],
      languages: getAlternateLinks("/cookie-policy"),
    },
  };
}

export default async function CookiePolicyPage() {
  const messages = await getMessages();
  const legalCommon = (
    messages as {
      legal: {
        common: {
          relatedLinks: {
            privacyPolicy: string;
          };
        };
      };
    }
  ).legal.common;

  return (
    <LegalPage
      eyebrow={cookiePolicyContent.eyebrow}
      title={cookiePolicyContent.title}
      intro={cookiePolicyContent.intro}
      effectiveDate={cookiePolicyContent.effectiveDate}
      sections={cookiePolicyContent.sections}
      relatedLinks={[{ href: "/privacy", label: legalCommon.relatedLinks.privacyPolicy }]}
    />
  );
}
