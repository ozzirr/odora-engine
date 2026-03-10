import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { defaultLocale, getLocalizedPathname, hasLocale, localeCookieName } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

function getFallbackLocale(request: NextRequest, nextPath?: string | null) {
  const pathLocale = nextPath?.split("/")[1];
  if (pathLocale && hasLocale(pathLocale)) {
    return pathLocale;
  }

  const cookieLocale = request.cookies.get(localeCookieName)?.value;
  return cookieLocale && hasLocale(cookieLocale) ? cookieLocale : defaultLocale;
}

function sanitizeNextPath(value: string | null, fallbackLocale: "it" | "en") {
  if (!value) {
    return getLocalizedPathname(fallbackLocale, "/perfumes");
  }

  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return getLocalizedPathname(fallbackLocale, "/perfumes");
  }

  if (
    trimmed === "/login" ||
    trimmed === "/signup" ||
    trimmed.endsWith("/login") ||
    trimmed.endsWith("/signup")
  ) {
    return getLocalizedPathname(fallbackLocale, "/perfumes");
  }

  return trimmed;
}

function isOtpType(value: string | null): value is EmailOtpType {
  return value === "signup" || value === "invite" || value === "magiclink" || value === "recovery" || value === "email_change" || value === "email";
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const fallbackLocale = getFallbackLocale(request, requestUrl.searchParams.get("next"));
  const nextPath = sanitizeNextPath(requestUrl.searchParams.get("next"), fallbackLocale);
  const loginPath = getLocalizedPathname(fallbackLocale, "/login");

  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return NextResponse.redirect(new URL(`${loginPath}?error=auth_not_configured`, requestUrl.origin));
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(new URL(`${loginPath}?error=auth_callback_failed`, requestUrl.origin));
    }

    return NextResponse.redirect(new URL(nextPath, requestUrl.origin));
  }

  if (tokenHash && isOtpType(type)) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (error) {
      return NextResponse.redirect(new URL(`${loginPath}?error=email_verification_failed`, requestUrl.origin));
    }

    return NextResponse.redirect(new URL(nextPath, requestUrl.origin));
  }

  return NextResponse.redirect(new URL(`${loginPath}?error=invalid_auth_callback`, requestUrl.origin));
}
