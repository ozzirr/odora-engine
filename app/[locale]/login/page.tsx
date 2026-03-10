import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { AuthSocialButtons } from "@/components/auth/AuthSocialButtons";
import { LoginForm } from "@/components/auth/LoginForm";
import { Container } from "@/components/layout/Container";
import { Link } from "@/lib/navigation";
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

function mapAuthErrorToMessage(
  errorCode: string | undefined,
  t: Awaited<ReturnType<typeof getTranslations>>,
) {
  if (!errorCode) {
    return undefined;
  }

  if (errorCode === "auth_callback_failed") {
    return t("errors.authCallbackFailed");
  }

  if (errorCode === "email_verification_failed") {
    return t("errors.emailVerificationFailed");
  }

  if (errorCode === "invalid_auth_callback") {
    return t("errors.invalidAuthCallback");
  }

  if (errorCode === "auth_not_configured") {
    return t("errors.authNotConfigured");
  }

  return t("errors.fallback");
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
      <div className="mx-auto max-w-md rounded-3xl border border-[#ddcfbe] bg-[#fffdf9] p-6 shadow-[0_20px_46px_-34px_rgba(53,39,27,0.4)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8b7762]">{t("eyebrow")}</p>
        <h1 className="mt-2 font-display text-4xl text-[#21180f]">{t("title")}</h1>
        <p className="mt-2 text-sm text-[#685747]">{t("subtitle")}</p>

        <LoginForm nextPath={nextPath} initialError={mapAuthErrorToMessage(errorCode, t)} />

        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-[#e4d8c9]" />
          <span className="text-xs uppercase tracking-[0.1em] text-[#8b7762]">{t("or")}</span>
          <span className="h-px flex-1 bg-[#e4d8c9]" />
        </div>

        <AuthSocialButtons mode="login" />

        <p className="mt-6 text-sm text-[#675545]">
          {t("signupPrompt")}{" "}
          <Link href="/signup" className="font-semibold text-[#2b2118] underline-offset-2 hover:underline">
            {t("signupLink")}
          </Link>
        </p>

        <p className="mt-3 text-xs text-[#8b7762]">{t("socialNotice")}</p>
      </div>
    </Container>
  );
}
