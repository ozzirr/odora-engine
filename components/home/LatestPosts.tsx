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
        {posts.map((post, index) => (
          <Link
            key={post.slug}
            href={`/${locale}/blog/${post.slug}`}
            className="group flex flex-col rounded-[1.4rem] border border-[#e0d5c6] bg-white overflow-hidden shadow-[0_18px_40px_-34px_rgba(50,35,20,0.28)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_52px_-34px_rgba(50,35,20,0.44)]"
          >
            {/* Decorative top band */}
            <div
              className="h-1.5 w-full"
              style={{
                background: index === 0
                  ? "linear-gradient(90deg,#c9a96e,#e8c98a)"
                  : index === 1
                  ? "linear-gradient(90deg,#a8937a,#c9b49a)"
                  : "linear-gradient(90deg,#8a9e8c,#b0c4b2)",
              }}
            />

            <div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
              {post.tags.length > 0 ? (
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8a7763]">
                  {post.tags[0]}
                </p>
              ) : null}
              <h3 className="font-display text-[1.35rem] leading-snug text-[#1f1914] transition-colors group-hover:text-[#6c5946]">
                {post.title}
              </h3>
              <p className="text-sm text-[#625243] leading-[1.7] line-clamp-3">{post.excerpt}</p>
              <p className="mt-auto pt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a7763] transition-colors group-hover:text-[#1f1914]">
                {t("cta")} →
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
