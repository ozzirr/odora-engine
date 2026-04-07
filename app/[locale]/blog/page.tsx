import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Container } from "@/components/layout/Container";
import { SectionTitle } from "@/components/ui/SectionTitle";
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

  const title =
    resolvedLocale === "it"
      ? "Blog – Guide e consigli sui profumi | Odora"
      : "Blog – Fragrance guides and tips | Odora";
  const description =
    resolvedLocale === "it"
      ? "Approfondimenti, guide olfattive e consigli per scegliere il tuo prossimo profumo."
      : "In-depth guides, olfactory tips and advice to help you find your next fragrance.";

  return buildPageMetadata({ title, description, locale: resolvedLocale, pathname: "/blog" });
}

function formatDate(date: Date, locale: string) {
  return date.toLocaleDateString(locale === "it" ? "it-IT" : "en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogPage({ params }: BlogPageProps) {
  const { locale } = await params;
  const resolvedLocale = (hasLocale(locale) ? locale : "en") as AppLocale;

  const posts = await getBlogPostList(resolvedLocale);

  const heading = resolvedLocale === "it" ? "Blog" : "Blog";
  const subtitle =
    resolvedLocale === "it"
      ? "Guide olfattive, consigli di stile e approfondimenti sul mondo dei profumi."
      : "Fragrance guides, style tips, and in-depth coverage of the perfume world.";
  const emptyMsg =
    resolvedLocale === "it" ? "Nessun articolo ancora. Torna presto." : "No articles yet. Check back soon.";

  return (
    <Container>
      <div className="mt-12 space-y-10">
        <SectionTitle eyebrow="ODORA JOURNAL" title={heading} subtitle={subtitle} as="h1" />

        {posts.length === 0 ? (
          <p className="text-sm text-[#8a7763]">{emptyMsg}</p>
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
