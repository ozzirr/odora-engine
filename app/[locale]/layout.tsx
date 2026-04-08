import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { HtmlLangSync } from "@/components/i18n/HtmlLangSync";
import { ScopedIntlProvider } from "@/components/i18n/ScopedIntlProvider";
import { LocaleShell } from "@/components/layout/LocaleShell";
import { StructuredData } from "@/components/seo/StructuredData";
import { getAlternateLinks, hasLocale, locales } from "@/lib/i18n";
import { isLaunchGateEnabled } from "@/lib/launch-gate";
import { buildOrganizationSchema, buildWebsiteSchema } from "@/lib/structured-data";
import { getBaseSiteUrl } from "@/lib/site-url";

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LocaleLayoutProps): Promise<Metadata> {
  const { locale } = await params;

  if (!hasLocale(locale)) {
    return {};
  }

  return {
    metadataBase: new URL(getBaseSiteUrl()),
    alternates: {
      canonical: getAlternateLinks("/")[locale],
      languages: getAlternateLinks("/"),
    },
    ...(isLaunchGateEnabled()
      ? {
          robots: {
            index: false,
            follow: false,
          },
        }
      : {}),
  };
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  if (!hasLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <ScopedIntlProvider
      locale={locale}
      namespaces={["layout", "privacyPreferences", "auth", "perfume.transition"]}
    >
      <HtmlLangSync />
      <StructuredData
        data={[
          buildOrganizationSchema(),
          buildWebsiteSchema(locale),
        ]}
      />
      <LocaleShell>
        {children}
      </LocaleShell>
    </ScopedIntlProvider>
  );
}
