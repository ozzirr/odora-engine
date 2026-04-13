import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { ScopedIntlProvider } from "@/components/i18n/ScopedIntlProvider";
import { Container } from "@/components/layout/Container";
import { ExpandableSeoIntro } from "@/components/ui/ExpandableSeoIntro";
import { getBlogPostList } from "@/lib/blog";
import { hasLocale, type AppLocale } from "@/lib/i18n";
import { buildPageMetadata } from "@/lib/metadata";

export const revalidate = 3600;

type BlogPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = hasLocale(locale) ? locale : "en";
  const t = await getTranslations({ locale: resolvedLocale, namespace: "blog.page" });

  return buildPageMetadata({
    title: t("metaTitle"),
    description: t("metaDescription"),
    locale: resolvedLocale,
    pathname: "/blog",
  });
}

function formatDate(date: Date | string, locale: string) {
  return new Date(date).toLocaleDateString(locale === "it" ? "it-IT" : "en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogPage({ params }: BlogPageProps) {
  const { locale } = await params;
  const resolvedLocale = (hasLocale(locale) ? locale : "en") as AppLocale;
  const t = await getTranslations({ locale: resolvedLocale, namespace: "blog.page" });

  const posts = await getBlogPostList(resolvedLocale);

  return (
    <Container className="pt-6 sm:pt-8">
      <div className="space-y-10">
        <ScopedIntlProvider locale={resolvedLocale} namespaces={["common"]}>
          <section className="space-y-4 rounded-3xl border border-[#dfd1bf] bg-white p-6 shadow-[0_20px_45px_-38px_rgba(48,34,20,0.24)] sm:p-8">
            <ExpandableSeoIntro
              eyebrow={t("eyebrow")}
              title={t("title")}
              subtitle={t("subtitle")}
              body={[t("bodyOne"), t("bodyTwo")]}
              primaryCta={{ href: "/perfumes", label: t("primaryCta") }}
              secondaryCta={{ href: "/finder", label: t("secondaryCta"), variant: "secondary" }}
              headingAs="h1"
            />
          </section>
        </ScopedIntlProvider>

        {posts.length === 0 ? (
          <p className="text-sm text-[#8a7763]">{t("empty")}</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/${resolvedLocale}/blog/${post.slug}`}
                className="premium-card group flex flex-col rounded-[1.4rem] border border-[#e0d5c6] bg-white/70 overflow-hidden shadow-[0_18px_40px_-34px_rgba(50,35,20,0.28)] transition-all duration-300 hover:-translate-y-0.5"
              >
                {post.coverImageUrl ? (
                  <div className="aspect-[16/9] w-full overflow-hidden bg-[#f4ece0]">
                    <img
                      src={post.coverImageUrl}
                      alt={post.title}
                      width={720}
                      height={405}
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="aspect-[16/9] w-full bg-gradient-to-br from-[#f7eddc] to-[#ead8c6]" />
                )}
                <div className="flex flex-1 flex-col gap-3 p-5">
                  {post.tags.length > 0 ? (
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a7763]">
                      {post.tags[0]}
                    </p>
                  ) : null}
                  <h2 className="font-display text-xl text-[#1f1914] leading-snug">{post.title}</h2>
                  <p className="text-sm text-[#625243] leading-6 line-clamp-3">{post.excerpt}</p>
                  <p className="mt-auto text-xs text-[#9a8878]">{formatDate(post.publishedAt, resolvedLocale)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
