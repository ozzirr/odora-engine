import Link from "next/link";
import { useTranslations } from "next-intl";

import { SectionTitle } from "@/components/ui/SectionTitle";
import type { BlogPostCard } from "@/lib/blog";

type LatestPostsProps = {
  posts: BlogPostCard[];
  locale: string;
};

export function LatestPosts({ posts, locale }: LatestPostsProps) {
  const t = useTranslations("home.latestPosts");

  if (posts.length === 0) {
    return null;
  }

  return (
    <section className="mt-24 space-y-6">
      <div className="flex items-end justify-between gap-4">
        <SectionTitle
          eyebrow={t("eyebrow")}
          title={t("title")}
          subtitle={t("subtitle")}
        />
        <Link
          href={`/${locale}/blog`}
          className="shrink-0 text-xs font-semibold uppercase tracking-[0.14em] text-[#816f5c] hover:text-[#1f1914] transition-colors"
        >
          {t("allPosts")} →
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/${locale}/blog/${post.slug}`}
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
            <div className="flex flex-1 flex-col gap-2 p-5">
              {post.tags.length > 0 ? (
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a7763]">
                  {post.tags[0]}
                </p>
              ) : null}
              <h3 className="font-display text-xl text-[#1f1914] leading-snug">{post.title}</h3>
              <p className="text-sm text-[#625243] leading-6 line-clamp-2">{post.excerpt}</p>
              <p className="mt-auto pt-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#816f5c]">
                {t("cta")}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
