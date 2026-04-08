import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";

import { Container } from "@/components/layout/Container";
import { getAllPublishedBlogSlugs, getBlogPost } from "@/lib/blog";
import { hasLocale, locales, type AppLocale } from "@/lib/i18n";
import { buildPageMetadata, toAbsoluteUrl } from "@/lib/metadata";

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

  const backLabel = resolvedLocale === "it" ? "← Torna al Blog" : "← Back to Blog";

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: new Date(post.publishedAt).toISOString(),
    dateModified: new Date(post.publishedAt).toISOString(),
    inLanguage: resolvedLocale === "it" ? "it-IT" : "en-GB",
    author: { "@type": "Organization", name: "Odora", url: toAbsoluteUrl("/") },
    publisher: { "@type": "Organization", name: "Odora", url: toAbsoluteUrl("/") },
    mainEntityOfPage: { "@type": "WebPage", "@id": toAbsoluteUrl(`/${resolvedLocale}/blog/${slug}`) },
    ...(post.coverImageUrl ? { image: post.coverImageUrl } : {}),
    keywords: post.tags.join(", "),
  };

  return (
    <Container>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
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

          <div className="mt-8">
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
