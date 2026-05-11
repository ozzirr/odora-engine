import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";

import { Container } from "@/components/layout/Container";
import { ScopedIntlProvider } from "@/components/i18n/ScopedIntlProvider";
import { LaunchGateExperience } from "@/components/launch/LaunchGateExperience";
import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { BrandLogoStrip } from "@/components/home/TrustedStores";
import { QuickFilters } from "@/components/home/QuickFilters";
import { ValueStrip } from "@/components/home/ValueStrip";
import { hasLocale, type AppLocale } from "@/lib/i18n";
import { buildPageMetadata } from "@/lib/metadata";
import {
  LAUNCH_GATE_ACCESS_COOKIE_NAME,
  hasLaunchGateAccess,
  isLaunchGateEnabled,
} from "@/lib/launch-gate";

export const revalidate = 3600;

type HomePageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = hasLocale(locale) ? locale : "en";
  const t = await getTranslations({ locale: resolvedLocale, namespace: "metadata.pages.home" });
  const title = isLaunchGateEnabled()
    ? resolvedLocale === "it"
      ? "Odora apre presto"
      : "Odora is opening soon"
    : t("title");
  const description = isLaunchGateEnabled()
    ? resolvedLocale === "it"
      ? "Coming soon privato con accesso riservato tramite password."
      : "Private coming soon page with password-protected access."
    : t("description");

  return buildPageMetadata({
    title,
    description,
    locale: resolvedLocale,
    pathname: "/",
    robots: isLaunchGateEnabled()
      ? {
          index: false,
          follow: false,
        }
      : undefined,
  });
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  const resolvedLocale = (hasLocale(locale) ? locale : "en") as AppLocale;

  if (isLaunchGateEnabled()) {
    const cookieStore = await cookies();
    const hasAccess = await hasLaunchGateAccess(
      cookieStore.get(LAUNCH_GATE_ACCESS_COOKIE_NAME)?.value,
    );

    if (!hasAccess) {
      return <LaunchGateExperience locale={resolvedLocale} />;
    }
  }

  return (
    <ScopedIntlProvider locale={resolvedLocale} namespaces={["home"]}>
      <>
        <Hero footer={<BrandLogoStrip brands={[]} variant="embedded" />} />
        <ValueStrip />

        <Container>
          <QuickFilters />
          <HowItWorks />
          <div className="pb-16 lg:pb-20" />
        </Container>
      </>
    </ScopedIntlProvider>
  );
}
