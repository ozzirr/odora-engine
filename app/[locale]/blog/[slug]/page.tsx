import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import ReactMarkdown from "react-markdown";

import { AdInArticle } from "@/components/ads/AdUnit";
import { Container } from "@/components/layout/Container";
import { getAllPublishedBlogSlugs, getBlogPost } from "@/lib/blog";
import { hasLocale, locales, type AppLocale } from "@/lib/i18n";
import { buildPageMetadata } from "@/lib/metadata";
import { StructuredData } from "@/components/seo/StructuredData";
import { buildArticleSchema } from "@/lib/structured-data";

export const revalidate = 3600;

type BlogPostPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateStaticParams() {
  const localizedSlugs = await Promise.all(
    locales.map(async (locale) => ({
      locale,
      slugs: await getAllPublishedBlogSlugs(locale),
    })),
  );

  return localizedSlugs.flatMap(({ locale, slugs }) =>
    slugs.map((slug) => ({ locale, slug })),
  );
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const resolvedLocale = hasLocale(locale) ? locale : "en";
  const post = await getBlogPost(slug, resolvedLocale);

  if (!post) {
    return {};
  }

  return buildPageMetadata({
    title: post.seoTitle ?? post.title,
    description: post.seoDescription ?? post.excerpt,
    locale: resolvedLocale,
    pathname: "/blog/[slug]",
    params: { slug },
    image: post.coverImageUrl ?? undefined,
  });
}

function formatDate(date: Date | string, locale: string) {
  return new Date(date).toLocaleDateString(locale === "it" ? "it-IT" : "en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { locale, slug } = await params;
  const resolvedLocale = (hasLocale(locale) ? locale : "en") as AppLocale;

  const post = await getBlogPost(slug, resolvedLocale);
  if (!post) notFound();

  const t = await getTranslations({ locale: resolvedLocale, namespace: "blog.post" });
  const backLabel = t("backLabel");
  const tldrItems = post.tldr && post.tldr.length > 0 ? post.tldr : null;

  const articleSchema = buildArticleSchema({
    headline: post.title,
    description: post.excerpt,
    path: `/${resolvedLocale}/blog/${slug}`,
    locale: resolvedLocale,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    image: post.coverImageUrl,
    keywords: post.tags,
  });

  return (
    <Container>
      <StructuredData data={articleSchema} />
      <div className="mx-auto mt-12 max-w-2xl">
        <Link
          href={`/${resolvedLocale}/blog`}
          className="text-sm font-medium text-[#8a7763] hover:text-[#1f1914] transition-colors"
        >
          {backLabel}
        </Link>

        <article className="mt-8">
          {post.coverImageUrl ? (
            <div className="mb-8 aspect-[16/9] w-full overflow-hidden rounded-[1.2rem] bg-[#f4ece0]">
              <Image
                src={post.coverImageUrl}
                alt={post.title}
                width={1280}
                height={720}
                sizes="(max-width: 1024px) 100vw, 768px"
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </div>
          ) : null}

          {post.tags.length > 0 ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a7763]">
              {post.tags.join(" · ")}
            </p>
          ) : null}

          <h1 className="mt-3 font-display text-4xl text-[#1f1914] leading-tight sm:text-5xl">
            {post.title}
          </h1>

          <p className="mt-3 text-sm text-[#9a8878]">{formatDate(post.publishedAt, resolvedLocale)}</p>

          <p className="mt-6 text-lg text-[#625243] leading-8 border-l-2 border-[#e0d5c6] pl-4 italic">
            {post.excerpt}
          </p>

          {tldrItems ? (
            <aside
              aria-label={t("tldrTitle")}
              className="mt-8 rounded-2xl border border-[#ddcfbc] bg-[#f8f1e6] p-5"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#907b66]">
                {t("tldrTitle")}
              </p>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[15px] leading-7 text-[#3d2e20]">
                {tldrItems.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </aside>
          ) : null}

          <div className="mt-8">
            <AdInArticle />
            <ReactMarkdown
              components={{
                h2: ({ children }) => (
                  <h2 className="mt-10 mb-3 font-display text-2xl text-[#1f1914]">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="mt-7 mb-2 font-display text-xl text-[#1f1914]">{children}</h3>
                ),
                p: ({ children }) => (
                  <p className="mt-4 text-[#3d2e20] leading-8">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="mt-4 list-disc pl-5 space-y-1.5">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="mt-4 list-decimal pl-5 space-y-1.5">{children}</ol>
                ),
                li: ({ children }) => (
                  <li className="text-[#3d2e20] leading-7">{children}</li>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-[#1f1914]">{children}</strong>
                ),
                em: ({ children }) => (
                  <em className="italic text-[#625243]">{children}</em>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    className="font-medium text-[#816f5c] underline underline-offset-2 hover:text-[#1f1914] transition-colors"
                    target={href?.startsWith("http") ? "_blank" : undefined}
                    rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
                  >
                    {children}
                  </a>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="mt-6 border-l-2 border-[#e0d5c6] pl-4 italic text-[#625243]">
                    {children}
                  </blockquote>
                ),
                hr: () => <hr className="my-8 border-[#e0d5c6]" />,
              }}
            >
              {post.content}
            </ReactMarkdown>
          </div>
        </article>
      </div>
    </Container>
  );
}
