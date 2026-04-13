import { BlogPostStatus } from "@prisma/client";
import { unstable_cache } from "next/cache";

import { PUBLIC_CACHE_TAGS } from "@/lib/cache-tags";
import { DEPLOY_ID } from "@/lib/deploy-id";
import { prisma } from "@/lib/prisma";

export type BlogPostCard = {
  slug: string;
  locale: string;
  title: string;
  excerpt: string;
  coverImageUrl: string | null;
  tags: string[];
  publishedAt: Date | string;
};

export type BlogPostFull = BlogPostCard & {
  content: string;
  seoTitle: string | null;
  seoDescription: string | null;
};

const BLOG_REVALIDATE_SECONDS = 3600;

export async function getLatestBlogPosts(locale: string, limit = 3): Promise<BlogPostCard[]> {
  return unstable_cache(
    async () =>
      prisma.blogPost.findMany({
        where: { locale, status: BlogPostStatus.PUBLISHED },
        orderBy: { publishedAt: "desc" },
        take: limit,
        select: {
          slug: true,
          locale: true,
          title: true,
          excerpt: true,
          coverImageUrl: true,
          tags: true,
          publishedAt: true,
        },
      }),
    [DEPLOY_ID, "blog-latest", locale, String(limit)],
    {
      revalidate: BLOG_REVALIDATE_SECONDS,
      tags: [PUBLIC_CACHE_TAGS.blog],
    },
  )();
}

export async function getBlogPostList(locale: string): Promise<BlogPostCard[]> {
  return unstable_cache(
    async () =>
      prisma.blogPost.findMany({
        where: { locale, status: BlogPostStatus.PUBLISHED },
        orderBy: { publishedAt: "desc" },
        select: {
          slug: true,
          locale: true,
          title: true,
          excerpt: true,
          coverImageUrl: true,
          tags: true,
          publishedAt: true,
        },
      }),
    [DEPLOY_ID, "blog-list", locale],
    {
      revalidate: BLOG_REVALIDATE_SECONDS,
      tags: [PUBLIC_CACHE_TAGS.blog],
    },
  )();
}

export async function getBlogPost(slug: string, locale: string): Promise<BlogPostFull | null> {
  return unstable_cache(
    async () =>
      prisma.blogPost.findUnique({
        where: { slug_locale: { slug, locale } },
        select: {
          slug: true,
          locale: true,
          title: true,
          excerpt: true,
          content: true,
          coverImageUrl: true,
          tags: true,
          publishedAt: true,
          seoTitle: true,
          seoDescription: true,
        },
      }) as Promise<BlogPostFull | null>,
    [DEPLOY_ID, "blog-post", locale, slug],
    {
      revalidate: BLOG_REVALIDATE_SECONDS,
      tags: [PUBLIC_CACHE_TAGS.blog],
    },
  )();
}

export async function getAllPublishedBlogSlugs(locale: string): Promise<string[]> {
  const posts = await unstable_cache(
    async () =>
      prisma.blogPost.findMany({
        where: { locale, status: BlogPostStatus.PUBLISHED },
        orderBy: { publishedAt: "desc" },
        select: { slug: true },
      }),
    [DEPLOY_ID, "blog-slugs", locale],
    {
      revalidate: BLOG_REVALIDATE_SECONDS,
      tags: [PUBLIC_CACHE_TAGS.blog],
    },
  )();

  return posts.map((post) => post.slug);
}
