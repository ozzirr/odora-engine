import { NextResponse } from "next/server";

import {
  LAUNCH_GATE_ACCESS_COOKIE_NAME,
  getLaunchGateAccessCookieValue,
  getLaunchGateCookieOptions,
  getLaunchGateRedirectPath,
  isLaunchGateConfigured,
  isLaunchGateEnabled,
  isValidLaunchGatePassword,
} from "@/lib/launch-gate";
import { defaultLocale, hasLocale, type AppLocale } from "@/lib/i18n";
import { buildRateLimitIdentity, getClientIp } from "@/lib/security/request-context";
import { consumeRateLimit } from "@/lib/security/rate-limit";

type AccessPayload = Partial<{
  password: unknown;
  locale: unknown;
}>;

export async function POST(request: Request) {
  if (!isLaunchGateEnabled()) {
    return NextResponse.json({ ok: true, redirectPath: getLaunchGateRedirectPath(defaultLocale) });
  }

  if (!isLaunchGateConfigured()) {
    return NextResponse.json({ error: "Preview access is temporarily unavailable." }, { status: 503 });
  }

  const payload = (await request.json().catch(() => ({}))) as AccessPayload;
  const password = typeof payload.password === "string" ? payload.password.trim() : "";
  const locale =
    typeof payload.locale === "string" && hasLocale(payload.locale)
      ? (payload.locale as AppLocale)
      : defaultLocale;
  const requestHeaders = request.headers;
  const rateLimitResult = consumeRateLimit(
    buildRateLimitIdentity(["launch-gate", getClientIp(requestHeaders)]),
    { limit: 8, windowMs: 10 * 60 * 1000, blockMs: 15 * 60 * 1000 },
  );

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Try again shortly." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimitResult.retryAfterSeconds),
        },
      },
    );
  }

  if (!password || !(await isValidLaunchGatePassword(password))) {
    return NextResponse.json({ error: "Invalid password." }, { status: 401 });
  }

  const cookieValue = await getLaunchGateAccessCookieValue();
  if (!cookieValue) {
    return NextResponse.json({ error: "Preview access is temporarily unavailable." }, { status: 503 });
  }

  const response = NextResponse.json({
    ok: true,
    redirectPath: getLaunchGateRedirectPath(locale),
  });
  response.cookies.set(
    LAUNCH_GATE_ACCESS_COOKIE_NAME,
    cookieValue,
    getLaunchGateCookieOptions(),
  );
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(LAUNCH_GATE_ACCESS_COOKIE_NAME, "", {
    ...getLaunchGateCookieOptions(),
    maxAge: 0,
  });
  return response;
}
