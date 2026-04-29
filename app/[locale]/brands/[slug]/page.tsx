import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { ScopedIntlProvider } from "@/components/i18n/ScopedIntlProvider";
import { Container } from "@/components/layout/Container";
import { PerfumeGrid } from "@/components/perfumes/PerfumeGrid";
import { BrandFollowButton } from "@/components/brands/BrandFollowButton";
import { StructuredData } from "@/components/seo/StructuredData";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { isFollowingBrand } from "@/lib/brand-follows";
import { getBrandBySlug, getBrandPerfumes } from "@/lib/brands";
import { getCurrentUser } from "@/lib/supabase/auth-state";
import { getLocalizedPathname, hasLocale, type AppLocale } from "@/lib/i18n";
import { buildPageMetadata } from "@/lib/metadata";
import {
  buildBrandSchema,
  buildBreadcrumbSchema,
  buildCollectionPageSchema,
  buildItemListSchema,
} from "@/lib/structured-data";

export const revalidate = 3600;

type BrandPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: BrandPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const resolvedLocale = (hasLocale(locale) ? locale : "en") as AppLocale;
  const t = await getTranslations({ locale: resolvedLocale, namespace: "metadata.pages.brandDetail" });
  const brand = await getBrandBySlug(slug);

  if (!brand) {
    return buildPageMetadata({
      title: t("notFoundTitle"),
      description: t("fallbackDescription"),
      locale: resolvedLocale,
      pathname: "/brands/[slug]",
      params: { slug },
    });
  }

  return buildPageMetadata({
    title: t("title", { name: brand.name }),
    description: brand.description ?? t("description", { name: brand.name }),
    locale: resolvedLocale,
    pathname: "/brands/[slug]",
    params: { slug },
    image: brand.logoUrl,
  });
}

export default async function BrandPage({ params }: BrandPageProps) {
  const { locale, slug } = await params;
  const resolvedLocale = (hasLocale(locale) ? locale : "en") as AppLocale;
  const brand = await getBrandBySlug(slug);

  if (!brand) notFound();

  const t = await getTranslations({ locale: resolvedLocale, namespace: "brand.page" });
  const navT = await getTranslations({ locale: resolvedLocale, namespace: "layout.header.nav" });
  const perfumes = await getBrandPerfumes(brand.id);
  const currentUser = await getCurrentUser();
  const initialIsFollowing = currentUser
    ? await isFollowingBrand(currentUser.id, brand.id)
    : false;

  const detailPath = getLocalizedPathname(resolvedLocale, "/brands/[slug]", { slug });
  const homePath = getLocalizedPathname(resolvedLocale, "/");
  const perfumesPath = getLocalizedPathname(resolvedLocale, "/perfumes");

  return (
    <>
      <StructuredData
        data={[
          buildBreadcrumbSchema([
            { name: navT("home"), path: homePath },
            { name: navT("perfumes"), path: perfumesPath },
            { name: t("breadcrumbBrand"), path: detailPath },
            { name: brand.name, path: detailPath },
          ]),
          buildBrandSchema({
            name: brand.name,
            path: detailPath,
            description: brand.description,
            logoUrl: brand.logoUrl,
            country: brand.country,
          }),
          buildCollectionPageSchema({
            name: t("title", { name: brand.name }),
            description: brand.description ?? t("subtitle", { name: brand.name }),
            path: detailPath,
            locale: resolvedLocale,
          }),
          buildItemListSchema({
            name: t("perfumesTitle", { name: brand.name }),
            path: detailPath,
            items: perfumes.map((perfume) => ({
              name: perfume.name,
              path: getLocalizedPathname(resolvedLocale, "/perfumes/[slug]", {
                slug: perfume.slug,
              }),
            })),
          }),
        ]}
      />

      <ScopedIntlProvider
        locale={resolvedLocale}
        namespaces={["common", "catalog", "perfume", "taxonomy", "brand"]}
      >
        <Container className="space-y-8 pt-6 pb-16 md:pt-8">
          <header className="overflow-hidden rounded-3xl border border-[#dfd1bf] bg-white shadow-[0_20px_45px_-38px_rgba(48,34,20,0.24)]">
            <div className="grid gap-6 p-6 sm:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.42fr)] lg:items-end">
              <div className="flex flex-col items-start gap-6 sm:flex-row">
              {brand.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={brand.logoUrl}
                  alt={brand.name}
                  className="h-20 w-20 shrink-0 rounded-2xl bg-[#f8f1e6] object-contain p-2"
                  loading="eager"
                />
              ) : null}
              <div className="min-w-0 space-y-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#907b66]">
                  {t("eyebrow")}
                </p>
                <h1 className="font-display text-[2rem] leading-[1.1] text-[#1e1813] sm:text-[2.5rem]">
                  {t("title", { name: brand.name })}
                </h1>
                <p className="max-w-2xl text-[14.5px] leading-[1.7] text-[#6b5a49]">
                  {brand.description ?? t("subtitle", { name: brand.name })}
                </p>
                {brand.country ? (
                  <p className="text-[13px] text-[#907b66]">
                    {t("country", { country: brand.country })}
                  </p>
                ) : null}
              </div>
              </div>
              <div className="lg:pl-2">
                <BrandFollowButton
                  brandId={brand.id}
                  brandName={brand.name}
                  initialIsFollowing={initialIsFollowing}
                  initialIsAuthenticated={Boolean(currentUser)}
                />
              </div>
            </div>
          </header>

          <section className="space-y-4">
            <SectionTitle title={t("perfumesTitle", { name: brand.name })} />
            {perfumes.length > 0 ? (
              <PerfumeGrid perfumes={perfumes} />
            ) : (
              <p className="rounded-2xl border border-[#ddcfbc] bg-white p-6 text-[14.5px] text-[#6b5a49]">
                {t("perfumesEmpty")}
              </p>
            )}
          </section>
        </Container>
      </ScopedIntlProvider>
    </>
  );
}
