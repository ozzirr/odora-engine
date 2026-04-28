import { CatalogStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { sendWeeklyRecommendationsEmail } from "@/lib/email/notifications";
import { defaultLocale, hasLocale, type AppLocale } from "@/lib/i18n";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";

function isAuthorized(request: Request) {
  const secret = process.env.ODORA_CRON_SECRET?.trim() || process.env.CRON_SECRET?.trim();

  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }

  return request.headers.get("authorization") === `Bearer ${secret}`;
}

function readBatchLimit() {
  const parsed = Number.parseInt(process.env.ODORA_WEEKLY_EMAIL_LIMIT ?? "200", 10);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 1000) : 200;
}

async function getRecommendedPerfumes() {
  return prisma.perfume.findMany({
    where: {
      catalogStatus: CatalogStatus.VERIFIED,
    },
    orderBy: [{ ratingInternal: "desc" }, { updatedAt: "desc" }, { name: "asc" }],
    take: 5,
    select: {
      name: true,
      slug: true,
      imageUrl: true,
      descriptionShort: true,
      fragranceFamily: true,
      brand: {
        select: {
          name: true,
        },
      },
      notes: {
        select: {
          intensity: true,
          note: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
        orderBy: [{ intensity: "desc" }, { id: "asc" }],
        take: 3,
      },
    },
  });
}

async function getLatestBlogPost(locale: AppLocale) {
  return prisma.blogPost.findFirst({
    where: {
      locale,
      status: "PUBLISHED",
    },
    orderBy: {
      publishedAt: "desc",
    },
    select: {
      slug: true,
      title: true,
      excerpt: true,
    },
  });
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isDatabaseConfigured) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }

  const perfumes = await getRecommendedPerfumes();
  if (perfumes.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, skipped: "no_perfumes" });
  }

  const subscribers = await prisma.newsletterSubscriber.findMany({
    where: {
      status: "SUBSCRIBED",
    },
    orderBy: {
      consentedAt: "desc",
    },
    take: readBatchLimit(),
    select: {
      email: true,
      locale: true,
    },
  });

  const blogPosts = {
    en: await getLatestBlogPost("en"),
    it: await getLatestBlogPost("it"),
  };
  let sent = 0;
  let failed = 0;

  for (const subscriber of subscribers) {
    const locale =
      subscriber.locale && hasLocale(subscriber.locale) ? subscriber.locale : defaultLocale;
    const result = await sendWeeklyRecommendationsEmail({
      to: subscriber.email,
      locale,
      perfumes,
      blogPost: blogPosts[locale],
    });

    if (result.ok) {
      sent += 1;
    } else {
      failed += 1;
      console.error("Failed to send weekly newsletter", {
        email: subscriber.email,
        error: result.error,
      });
    }
  }

  return NextResponse.json({ ok: true, sent, failed, total: subscribers.length });
}
