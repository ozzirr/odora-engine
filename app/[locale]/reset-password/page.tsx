import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { RequestPasswordResetForm } from "@/components/auth/RequestPasswordResetForm";
import { UpdatePasswordForm } from "@/components/auth/UpdatePasswordForm";
import { ScopedIntlProvider } from "@/components/i18n/ScopedIntlProvider";
import { Container } from "@/components/layout/Container";
import { getLocalizedPathname, hasLocale } from "@/lib/i18n";
import { buildPageMetadata } from "@/lib/metadata";

type ResetPasswordPageProps = {
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

export async function generateMetadata({ params }: ResetPasswordPageProps): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = hasLocale(locale) ? locale : "en";
  const t = await getTranslations({ locale: resolvedLocale, namespace: "metadata.pages.resetPassword" });

  return buildPageMetadata({
    title: t("title"),
    description: t("description"),
    locale: resolvedLocale,
    pathname: "/reset-password",
    robots: {
      index: false,
      follow: true,
    },
  });
}

export default async function ResetPasswordPage({ params, searchParams }: ResetPasswordPageProps) {
  const { locale } = await params;
  const resolvedLocale = hasLocale(locale) ? locale : "en";
  const resolvedSearchParams = await searchParams;
  const mode = parseValue(resolvedSearchParams.mode) === "update" ? "update" : "request";
  const t = await getTranslations({
    locale: resolvedLocale,
    namespace: mode === "update" ? "auth.resetPassword.page.update" : "auth.resetPassword.page.request",
  });
  const loginHref = getLocalizedPathname(resolvedLocale, "/login");

  return (
    <Container className="py-14 sm:py-18">
      <ScopedIntlProvider locale={resolvedLocale} namespaces={["auth"]}>
        <div className="mx-auto max-w-md rounded-[2rem] border border-[#ddcfbe] bg-[#fffdf9] p-6 shadow-[0_20px_46px_-34px_rgba(53,39,27,0.4)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8b7762]">{t("eyebrow")}</p>
          <h1 className="mt-2 font-display text-4xl text-[#21180f]">{t("title")}</h1>
          <p className="mt-2 text-sm text-[#685747]">{t("subtitle")}</p>

          {mode === "update" ? <UpdatePasswordForm /> : <RequestPasswordResetForm />}

          <p className="mt-6 text-sm text-[#675545]">
            <a href={loginHref} className="font-semibold text-[#2b2118] underline-offset-2 hover:underline">
              {t("backToLogin")}
            </a>
          </p>
        </div>
      </ScopedIntlProvider>
    </Container>
  );
}
