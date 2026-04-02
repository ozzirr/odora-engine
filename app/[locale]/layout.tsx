import type { Metadata } from "next";
import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { LocaleShell } from "@/components/layout/LocaleShell";
import { StructuredData } from "@/components/seo/StructuredData";
import { getAlternateLinks, hasLocale, locales } from "@/lib/i18n";
import {
  LAUNCH_GATE_ACCESS_COOKIE_NAME,
  hasLaunchGateAccess,
  isLaunchGateEnabled,
} from "@/lib/launch-gate";
import { getIsAuthenticated } from "@/lib/supabase/auth-state";
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
  const cookieStore = await cookies();
  const hideChrome =
    isLaunchGateEnabled() &&
    !hasLaunchGateAccess(cookieStore.get(LAUNCH_GATE_ACCESS_COOKIE_NAME)?.value);
  const messages = await getMessages({ locale });
  const initialIsAuthenticated = await getIsAuthenticated();

  return (
    <NextIntlClientProvider key={locale} locale={locale} messages={messages}>
      <StructuredData
        data={[
          buildOrganizationSchema(),
          buildWebsiteSchema(locale),
        ]}
      />
      <LocaleShell hideChrome={hideChrome} initialIsAuthenticated={initialIsAuthenticated}>
        {children}
      </LocaleShell>
    </NextIntlClientProvider>
  );
}
