import { NextResponse } from "next/server";

import { sendBrandNewPerfumeEmail } from "@/lib/email/notifications";
import { defaultLocale, hasLocale, type AppLocale } from "@/lib/i18n";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";

function isAuthorized(request: Request) {
  const secret = process.env.ODORA_CRON_SECRET?.trim() || process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== "production";
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isDatabaseConfigured) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const follows = await prisma.brandFollow.findMany({
    select: {
      id: true,
      userId: true,
      brandId: true,
      lastNotifiedAt: true,
      createdAt: true,
      user: { select: { email: true } },
      brand: { select: { id: true, name: true, slug: true } },
    },
  });

  let sent = 0;
  let skipped = 0;
  let errors = 0;
  const notifiedFollowIds: number[] = [];

  for (const follow of follows) {
    const email = follow.user.email?.trim();
    if (!email) {
      skipped++;
      continue;
    }

    const since = follow.lastNotifiedAt ?? follow.createdAt;
    const newPerfumes = await prisma.perfume.findMany({
      where: {
        brandId: follow.brandId,
        createdAt: { gt: since },
      },
      select: { id: true, name: true, slug: true, imageUrl: true, createdAt: true },
      orderBy: { createdAt: "asc" },
      take: 10,
    });

    if (newPerfumes.length === 0) {
      skipped++;
      continue;
    }

    const locale: AppLocale = hasLocale(defaultLocale) ? defaultLocale : "en";
    const result = await sendBrandNewPerfumeEmail({
      to: email,
      locale,
      brandName: follow.brand.name,
      brandSlug: follow.brand.slug,
      perfumes: newPerfumes.map((p) => ({ name: p.name, slug: p.slug, imageUrl: p.imageUrl })),
    });

    if (result.ok) {
      sent++;
      notifiedFollowIds.push(follow.id);
    } else {
      errors++;
    }
  }

  if (notifiedFollowIds.length > 0) {
    await prisma.brandFollow.updateMany({
      where: { id: { in: notifiedFollowIds } },
      data: { lastNotifiedAt: new Date() },
    });
  }

  return NextResponse.json({ sent, skipped, errors, totalFollows: follows.length });
}

export async function GET(request: Request) {
  return POST(request);
}
