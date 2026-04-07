import { BlogPostStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type BlogPostCard = {
  slug: string;
  locale: string;
  title: string;
  excerpt: string;
  coverImageUrl: string | null;
  tags: string[];
  publishedAt: Date;
};

export type BlogPostFull = BlogPostCard & {
  content: string;
  seoTitle: string | null;
  seoDescription: string | null;
};

export async function getLatestBlogPosts(locale: string, limit = 3): Promise<BlogPostCard[]> {
  return prisma.blogPost.findMany({
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
  });
}

export async function getBlogPostList(locale: string): Promise<BlogPostCard[]> {
  return prisma.blogPost.findMany({
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
  });
}

export async function getBlogPost(slug: string, locale: string): Promise<BlogPostFull | null> {
  return prisma.blogPost.findUnique({
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
  }) as Promise<BlogPostFull | null>;
}

export async function getAllPublishedBlogSlugs(locale: string): Promise<string[]> {
  const posts = await prisma.blogPost.findMany({
    where: { locale, status: BlogPostStatus.PUBLISHED },
    orderBy: { publishedAt: "desc" },
    select: { slug: true },
  });
  return posts.map((p) => p.slug);
}
