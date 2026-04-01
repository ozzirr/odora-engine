import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { AuthPanel } from "@/components/auth/AuthPanel";
import { mapSignupAuthError } from "@/components/auth/auth-errors";
import { Container } from "@/components/layout/Container";
import { getLocalizedPathname, hasLocale } from "@/lib/i18n";
import { buildPageMetadata } from "@/lib/metadata";

type SignupPageProps = {
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

export async function generateMetadata({ params }: SignupPageProps): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = hasLocale(locale) ? locale : "en";
  const t = await getTranslations({ locale: resolvedLocale, namespace: "metadata.pages.signup" });

  return buildPageMetadata({
    title: t("title"),
    description: t("description"),
    locale: resolvedLocale,
    pathname: "/signup",
    robots: {
      index: false,
      follow: true,
    },
  });
}

export default async function SignupPage({ params, searchParams }: SignupPageProps) {
  const { locale } = await params;
  const resolvedLocale = hasLocale(locale) ? locale : "en";
  const t = await getTranslations({ locale: resolvedLocale, namespace: "auth.signup.page" });
  const resolvedSearchParams = await searchParams;
  const nextPath = parseValue(resolvedSearchParams.next) ?? getLocalizedPathname(resolvedLocale, "/perfumes");
  const errorCode = parseValue(resolvedSearchParams.error);

  return (
    <Container className="py-14 sm:py-18">
      <AuthPanel mode="signup" nextPath={nextPath} initialError={mapSignupAuthError(errorCode, t)} switchHref="/login" />
    </Container>
  );
}
