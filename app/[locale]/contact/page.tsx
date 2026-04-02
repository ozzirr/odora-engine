import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { Container } from "@/components/layout/Container";
import { hasLocale } from "@/lib/i18n";
import { buildPageMetadata } from "@/lib/metadata";

type ContactPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({ params }: ContactPageProps): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = hasLocale(locale) ? locale : "en";
  const t = await getTranslations({ locale: resolvedLocale, namespace: "metadata.pages.contact" });

  return buildPageMetadata({
    title: t("title"),
    description: t("description"),
    locale: resolvedLocale,
    pathname: "/contact",
  });
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { locale } = await params;
  const resolvedLocale = hasLocale(locale) ? locale : "en";
  const t = await getTranslations({ locale: resolvedLocale, namespace: "contact" });

  return (
    <Container className="py-14 sm:py-18">
      <div className="mx-auto max-w-2xl space-y-8">
        <header className="rounded-3xl border border-[#ddcfbe] bg-[#fffdf9] p-6 shadow-[0_20px_46px_-34px_rgba(53,39,27,0.4)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8b7762]">
            {t("eyebrow")}
          </p>
          <h1 className="mt-2 font-display text-4xl text-[#21180f]">{t("title")}</h1>
          <p className="mt-4 text-sm leading-7 text-[#685747]">{t("intro")}</p>
        </header>

        <section className="rounded-3xl border border-[#ddcfbe] bg-white p-6 sm:p-8">
          <h2 className="font-display text-2xl text-[#21180f]">{t("emailTitle")}</h2>
          <p className="mt-3 text-sm leading-7 text-[#685747]">{t("emailDescription")}</p>
          <a
            href="mailto:info@odora.it"
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#dfcfbc] bg-[#fcfaf6] px-5 py-3 text-sm font-medium text-[#3f3126] transition-all hover:border-[#ceb89d] hover:bg-white hover:text-[#1f1914]"
          >
            <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 text-[#9b8269]" aria-hidden="true">
              <path
                d="M2.5 6.5L10 11.5L17.5 6.5M3 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            info@odora.it
          </a>
        </section>
      </div>
    </Container>
  );
}
