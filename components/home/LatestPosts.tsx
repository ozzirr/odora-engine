import Link from "next/link";
import { useTranslations } from "next-intl";

import { SectionTitle } from "@/components/ui/SectionTitle";
import type { BlogPostCard } from "@/lib/blog";

type LatestPostsProps = {
  posts: BlogPostCard[];
  locale: string;
};

const BAND_GRADIENTS = [
  "linear-gradient(90deg,#c4a060,#ddb870)",
  "linear-gradient(90deg,#a0907a,#bfb09a)",
  "linear-gradient(90deg,#7a9a80,#a0c0a8)",
];

export function LatestPosts({ posts, locale }: LatestPostsProps) {
  const t = useTranslations("home.latestPosts");

  if (posts.length === 0) {
    return null;
  }

  return (
    <section className="section-gap space-y-8">
      <div className="flex items-end justify-between gap-4">
        <SectionTitle
          eyebrow={t("eyebrow")}
          title={t("title")}
          subtitle={t("subtitle")}
        />
        <Link
          href={`/${locale}/blog`}
          className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#907b66] hover:text-[#1e1813] transition-colors"
        >
          {t("allPosts")} →
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {posts.map((post, index) => (
          <Link
            key={post.slug}
            href={`/${locale}/blog/${post.slug}`}
            className="group flex flex-col rounded-[var(--radius-card)] border border-[#ede4d8] bg-white overflow-hidden shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]"
          >
            {/* Decorative top band */}
            <div
              className="h-1 w-full"
              style={{ background: BAND_GRADIENTS[index] ?? BAND_GRADIENTS[0] }}
            />

            <div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
              {post.tags.length > 0 ? (
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#907b66]">
                  {post.tags[0]}
                </p>
              ) : null}
              <h3 className="font-display text-[1.25rem] leading-[1.2] text-[#1e1813] transition-colors group-hover:text-[#6c5946]">
                {post.title}
              </h3>
              <p className="text-[13.5px] text-[#6b5a49] leading-[1.7] line-clamp-3">{post.excerpt}</p>
              <p className="mt-auto pt-4 text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[#907b66] transition-colors group-hover:text-[#1e1813]">
                {t("cta")} →
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
