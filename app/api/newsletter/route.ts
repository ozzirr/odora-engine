import { NextResponse } from "next/server";

import { defaultLocale, hasLocale, type AppLocale } from "@/lib/i18n";
import {
  isValidNewsletterEmail,
  normalizeNewsletterEmail,
  subscribeToNewsletter,
} from "@/lib/newsletter";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { buildRateLimitIdentity, getClientIp } from "@/lib/security/request-context";

type NewsletterPayload = Partial<{
  email: unknown;
  locale: unknown;
  consent: unknown;
}>;

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

  return NextResponse.json({ ok: true });
}
