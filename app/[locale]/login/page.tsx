import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AuthPanel } from "@/components/auth/AuthPanel";
import { ScopedIntlProvider } from "@/components/i18n/ScopedIntlProvider";
import { mapLoginAuthError } from "@/components/auth/auth-errors";
import { Container } from "@/components/layout/Container";
import { buildAuthModalUrl } from "@/lib/auth-modal";
import { sanitizeAuthNextPath } from "@/lib/auth-navigation";
import { getLocalizedPathname, hasLocale } from "@/lib/i18n";
import { buildPageMetadata } from "@/lib/metadata";

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

function canShowLoginOverPath(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const pageSegment = segments[1]?.toLowerCase();
  return pageSegment !== "profile" && pageSegment !== "profilo";
}

export async function generateMetadata({ params }: LoginPageProps): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = hasLocale(locale) ? locale : "en";
  const t = await getTranslations({ locale: resolvedLocale, namespace: "metadata.pages.login" });

  return buildPageMetadata({
    title: t("title"),
    description: t("description"),
    locale: resolvedLocale,
    pathname: "/login",
    robots: {
      index: false,
      follow: true,
    },
  });
}

export default async function LoginPage({ params, searchParams }: LoginPageProps) {
  const { locale } = await params;
  const resolvedLocale = hasLocale(locale) ? locale : "en";
  const t = await getTranslations({ locale: resolvedLocale, namespace: "auth.login.page" });
  const resolvedSearchParams = await searchParams;
  const fallbackNextPath = getLocalizedPathname(resolvedLocale, "/perfumes");
  const rawNextPath = parseValue(resolvedSearchParams.next);
  const nextPath = sanitizeAuthNextPath(rawNextPath, fallbackNextPath);
  const errorCode = parseValue(resolvedSearchParams.error);

  if (rawNextPath && canShowLoginOverPath(nextPath)) {
    const nextUrl = new URL(nextPath, "https://odora.local");
    const modalUrl = buildAuthModalUrl(
      nextUrl.pathname,
      nextUrl.searchParams,
      "login",
      nextUrl.hash,
      nextPath,
    );

    if (errorCode) {
      const redirectUrl = new URL(modalUrl, "https://odora.local");
      redirectUrl.searchParams.set("error", errorCode);
      redirect(`${redirectUrl.pathname}${redirectUrl.search}${redirectUrl.hash}`);
    }

    redirect(modalUrl);
  }

  return (
    <Container className="py-14 sm:py-18">
      <ScopedIntlProvider locale={resolvedLocale} namespaces={["auth"]}>
        <AuthPanel
          mode="login"
          nextPath={nextPath}
          initialError={mapLoginAuthError(errorCode, t)}
          switchHref="/signup"
          showDevLogin={process.env.NODE_ENV !== "production"}
        />
      </ScopedIntlProvider>
    </Container>
  );
}
