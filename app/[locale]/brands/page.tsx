import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { BrandListLink, BrandListScrollRestore } from "@/components/brands/BrandListScrollMemory";
import { BrandLogoImage } from "@/components/brands/BrandLogoImage";
import { ScopedIntlProvider } from "@/components/i18n/ScopedIntlProvider";
import { Container } from "@/components/layout/Container";
import { StructuredData } from "@/components/seo/StructuredData";
import { resolveBrandLogoUrl } from "@/lib/brand-logos";
import { getAllBrandsWithCount } from "@/lib/brands";
import { getLocalizedPathname, hasLocale, type AppLocale } from "@/lib/i18n";
import { buildPageMetadata } from "@/lib/metadata";
import { buildBreadcrumbSchema, buildCollectionPageSchema } from "@/lib/structured-data";

export const revalidate = 3600;

type BrandsPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: BrandsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = (hasLocale(locale) ? locale : "en") as AppLocale;
  const t = await getTranslations({ locale: resolvedLocale, namespace: "metadata.pages.brands" });

  return buildPageMetadata({
    title: t("title"),
    description: t("description"),
    locale: resolvedLocale,
    pathname: "/brands",
  });
}

export default async function BrandsListPage({ params }: BrandsPageProps) {
  const { locale } = await params;
  const resolvedLocale = (hasLocale(locale) ? locale : "en") as AppLocale;
  const t = await getTranslations({ locale: resolvedLocale, namespace: "brand.list" });
  const navT = await getTranslations({ locale: resolvedLocale, namespace: "layout.header.nav" });
  const brands = await getAllBrandsWithCount();

  const listPath = getLocalizedPathname(resolvedLocale, "/brands");
  const homePath = getLocalizedPathname(resolvedLocale, "/");

  return (
    <>
      <StructuredData
        data={[
          buildBreadcrumbSchema([
            { name: navT("home"), path: homePath },
            { name: t("breadcrumb"), path: listPath },
          ]),
          buildCollectionPageSchema({
            name: t("title"),
            description: t("subtitle"),
            path: listPath,
            locale: resolvedLocale,
          }),
        ]}
      />

      <ScopedIntlProvider locale={resolvedLocale} namespaces={["common", "catalog"]}>
        <BrandListScrollRestore />
        <Container className="space-y-8 pt-6 pb-16 md:pt-8">
          <header className="rounded-3xl border border-[#dfd1bf] bg-white p-6 shadow-[0_20px_45px_-38px_rgba(48,34,20,0.24)] sm:p-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#907b66]">
              {t("eyebrow")}
            </p>
            <h1 className="mt-3 font-display text-[2rem] leading-[1.1] text-[#1e1813] sm:text-[2.5rem]">
              {t("title")}
            </h1>
            <p className="mt-3 max-w-2xl text-[14.5px] leading-[1.7] text-[#6b5a49]">
              {t("subtitle")}
            </p>
          </header>

          {brands.length === 0 ? (
            <p className="rounded-2xl border border-[#ddcfbc] bg-white p-6 text-[14.5px] text-[#6b5a49]">
              {t("empty")}
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {brands.map((brand) => {
                const resolvedLogoUrl = resolveBrandLogoUrl(brand.logoUrl, brand.name, brand.slug);

                return (
                  <li key={brand.id}>
                    <BrandListLink
                      slug={brand.slug}
                      brandName={brand.name}
                      className="group flex items-center gap-4 rounded-2xl border border-[#e3d6c2] bg-white p-4 transition-all hover:-translate-y-[1px] hover:border-[#c9b89e] hover:shadow-[0_18px_45px_-32px_rgba(48,34,20,0.32)]"
                    >
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#ecdfca] bg-[#f8f1e6]">
                        <BrandLogoImage
                          src={resolvedLogoUrl}
                          alt={brand.name}
                          className="h-full w-full object-contain p-1.5"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-[1.1rem] text-[#1e1813] group-hover:text-[#0d0a07]">
                          {brand.name}
                        </p>
                        <p className="mt-0.5 text-[13px] text-[#907b66]">
                          {t("perfumeCount", { count: brand._count.perfumes })}
                          {brand.country ? ` · ${brand.country}` : ""}
                        </p>
                      </div>
                      <span
                        aria-hidden="true"
                        className="text-[#9f876f] transition-transform group-hover:translate-x-0.5"
                      >
                        <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4">
                          <path
                            d="M4 12L12 4M6 4H12V10"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    </BrandListLink>
                  </li>
                );
              })}
            </ul>
          )}
        </Container>
      </ScopedIntlProvider>
    </>
  );
}
