import { NextResponse } from "next/server";

import { sendFinderReportEmail } from "@/lib/email/notifications";
import { isResendConfigured } from "@/lib/email/resend";
import { buildFinderPreferencesFromInput } from "@/lib/finder";
import { defaultLocale, hasLocale, type AppLocale } from "@/lib/i18n";
import {
  isValidNewsletterEmail,
  normalizeNewsletterEmail,
  subscribeToNewsletter,
} from "@/lib/newsletter";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { buildRateLimitIdentity, getClientIp } from "@/lib/security/request-context";

type NewsletterPayload = Partial<{
  email: unknown;
  locale: unknown;
  consent: unknown;
  preferences: unknown;
  resultIds: unknown;
  source: unknown;
  totalMatches: unknown;
}>;

function readStringField(source: Record<string, unknown>, key: string) {
  const value = source[key];
  return typeof value === "string" ? value : null;
}

function readBooleanField(source: Record<string, unknown>, key: string) {
  const value = source[key];
  return typeof value === "boolean" || typeof value === "string" ? value : null;
}

function readResultIds(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  const ids = value
    .map((item) => {
      if (typeof item === "number") return item;
      if (typeof item === "string") return Number.parseInt(item, 10);
      return Number.NaN;
    })
    .filter((item) => Number.isInteger(item) && item > 0);

  return Array.from(new Set(ids)).slice(0, 10);
}

function readTotalMatches(value: unknown, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(0, Math.floor(value));
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as NewsletterPayload;
  const email = typeof payload.email === "string" ? normalizeNewsletterEmail(payload.email) : "";
  const locale =
    typeof payload.locale === "string" && hasLocale(payload.locale)
      ? (payload.locale as AppLocale)
      : defaultLocale;
  const consent = payload.consent === true;

  if (!email || !isValidNewsletterEmail(email)) {
    return NextResponse.json({ error: "Invalid email." }, { status: 400 });
  }

  if (!consent) {
    return NextResponse.json({ error: "Marketing consent is required." }, { status: 400 });
  }

  const clientIp = getClientIp(request.headers);
  const rateLimitResult = consumeRateLimit(
    buildRateLimitIdentity(["newsletter", clientIp, email]),
    { limit: 3, windowMs: 30 * 60 * 1000, blockMs: 60 * 60 * 1000 },
  );

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: "Too many newsletter requests. Try again shortly." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimitResult.retryAfterSeconds),
        },
      },
    );
  }

  const result = await subscribeToNewsletter({
    email,
    locale,
    source: "api",
    ip: clientIp,
    userAgent: request.headers.get("user-agent"),
  });

  if (!result.ok) {
    const status = result.error === "database_unavailable" ? 503 : 500;
    return NextResponse.json({ error: "Newsletter signup is temporarily unavailable." }, { status });
  }

  const resultIds = readResultIds(payload.resultIds);
  const totalMatches = readTotalMatches(payload.totalMatches, resultIds.length);
  const preferencesPayload =
    typeof payload.preferences === "object" && payload.preferences !== null
      ? (payload.preferences as Record<string, unknown>)
      : {};
  const preferences = buildFinderPreferencesFromInput({
    gender: readStringField(preferencesPayload, "gender"),
    mood: readStringField(preferencesPayload, "mood"),
    season: readStringField(preferencesPayload, "season"),
    occasion: readStringField(preferencesPayload, "occasion"),
    preferredNote: readStringField(preferencesPayload, "preferredNote"),
    note: readStringField(preferencesPayload, "note"),
    budget: readStringField(preferencesPayload, "budget"),
    arabicOnly: readBooleanField(preferencesPayload, "arabicOnly"),
    nicheOnly: readBooleanField(preferencesPayload, "nicheOnly"),
  });

  const shouldSendFinderReport = payload.source === "finder_report";

  if (shouldSendFinderReport && isResendConfigured()) {
    const perfumeRows =
      isDatabaseConfigured && resultIds.length > 0
        ? await prisma.perfume.findMany({
            where: {
              id: {
                in: resultIds,
              },
            },
            select: {
              id: true,
              name: true,
              slug: true,
              imageUrl: true,
              fragranceFamily: true,
              ratingInternal: true,
              bestPriceAmount: true,
              bestTotalPriceAmount: true,
              bestCurrency: true,
              brand: {
                select: {
                  name: true,
                },
              },
              notes: {
                orderBy: [{ intensity: "desc" }, { id: "asc" }],
                select: {
                  intensity: true,
                  note: {
                    select: {
                      name: true,
                      slug: true,
                    },
                  },
                },
                take: 6,
              },
            },
          })
        : [];
    const resultOrder = new Map(resultIds.map((id, index) => [id, index]));
    const perfumes = perfumeRows.sort(
      (left, right) => (resultOrder.get(left.id) ?? 999) - (resultOrder.get(right.id) ?? 999),
    );
    const emailResult = await sendFinderReportEmail({
      to: email,
      locale,
      preferences,
      perfumes,
      totalMatches: totalMatches || perfumes.length,
    });

    if (!emailResult.ok) {
      console.error("Finder report email could not be sent", emailResult.error);
      return NextResponse.json({ error: "Report email could not be sent." }, { status: 502 });
    }

    return NextResponse.json({ ok: true, reportEmailSent: true });
  }

  if (shouldSendFinderReport) {
    console.warn("Resend is not configured; skipping Finder report email.");
    return NextResponse.json({ ok: true, reportEmailSent: false });
  }

  return NextResponse.json({ ok: true });
}
