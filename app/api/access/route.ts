import { NextResponse } from "next/server";

import {
  LAUNCH_GATE_ACCESS_COOKIE_NAME,
  getLaunchGateAccessCookieValue,
  getLaunchGateCookieOptions,
  getLaunchGatePassword,
  getLaunchGateRedirectPath,
  isLaunchGateEnabled,
} from "@/lib/launch-gate";
import { defaultLocale, hasLocale, type AppLocale } from "@/lib/i18n";

type AccessPayload = Partial<{
  password: unknown;
  locale: unknown;
}>;

export async function POST(request: Request) {
  if (!isLaunchGateEnabled()) {
    return NextResponse.json({ ok: true, redirectPath: getLaunchGateRedirectPath(defaultLocale) });
  }

  const payload = (await request.json().catch(() => ({}))) as AccessPayload;
  const password = typeof payload.password === "string" ? payload.password.trim() : "";
  const locale =
    typeof payload.locale === "string" && hasLocale(payload.locale)
      ? (payload.locale as AppLocale)
      : defaultLocale;

  if (!password || password !== getLaunchGatePassword()) {
    return NextResponse.json({ error: "Invalid password." }, { status: 401 });
  }

  const response = NextResponse.json({
    ok: true,
    redirectPath: getLaunchGateRedirectPath(locale),
  });
  response.cookies.set(
    LAUNCH_GATE_ACCESS_COOKIE_NAME,
    getLaunchGateAccessCookieValue(),
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
