import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { AuthPanel } from "@/components/auth/AuthPanel";
import { mapLoginAuthError } from "@/components/auth/auth-errors";
import { Container } from "@/components/layout/Container";
import { getAlternateLinks, getLocalizedPathname, hasLocale } from "@/lib/i18n";

type LoginPageProps = {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function parseValue(value: string | string[] | undefined) {
  if (typeof value === "string") {
    return value;
  }
  return undefined;
}

export async function generateMetadata({ params }: LoginPageProps): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = hasLocale(locale) ? locale : "en";
  const t = await getTranslations({ locale: resolvedLocale, namespace: "metadata.pages.login" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: getAlternateLinks("/login")[resolvedLocale],
      languages: getAlternateLinks("/login"),
    },
  };
}

export default async function LoginPage({ params, searchParams }: LoginPageProps) {
  const { locale } = await params;
  const resolvedLocale = hasLocale(locale) ? locale : "en";
  const t = await getTranslations({ locale: resolvedLocale, namespace: "auth.login.page" });
  const resolvedSearchParams = await searchParams;
  const nextPath = parseValue(resolvedSearchParams.next) ?? getLocalizedPathname(resolvedLocale, "/perfumes");
  const errorCode = parseValue(resolvedSearchParams.error);

  return (
    <Container className="py-14 sm:py-18">
      <AuthPanel mode="login" nextPath={nextPath} initialError={mapLoginAuthError(errorCode, t)} switchHref="/signup" />
    </Container>
  );
}
