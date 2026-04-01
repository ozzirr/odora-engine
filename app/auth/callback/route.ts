import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { sanitizeAuthNextPath } from "@/lib/auth-navigation";
import { defaultLocale, getLocalizedPathname, hasLocale, localeCookieName } from "@/lib/i18n";
import { createRouteHandlerClient } from "@/lib/supabase/server";

function getFallbackLocale(request: NextRequest, nextPath?: string | null) {
  const pathLocale = nextPath?.split("/")[1];
  if (pathLocale && hasLocale(pathLocale)) {
    return pathLocale;
  }

  const cookieLocale = request.cookies.get(localeCookieName)?.value;
  return cookieLocale && hasLocale(cookieLocale) ? cookieLocale : defaultLocale;
}

function buildAuthErrorRedirect(
  requestUrl: URL,
  fallbackLocale: "it" | "en",
  rawNextPath: string | null,
  nextPath: string,
  errorCode: string,
) {
  const loginPath = getLocalizedPathname(fallbackLocale, "/login");

  if (!rawNextPath) {
    return new URL(`${loginPath}?error=${errorCode}`, requestUrl.origin);
  }

  const redirectUrl = new URL(nextPath, requestUrl.origin);
  redirectUrl.searchParams.set("auth", "login");
  redirectUrl.searchParams.set("authNext", nextPath);
  redirectUrl.searchParams.set("error", errorCode);
  return redirectUrl;
}

function isOtpType(value: string | null): value is EmailOtpType {
  return value === "signup" || value === "invite" || value === "magiclink" || value === "recovery" || value === "email_change" || value === "email";
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const rawNextPath = requestUrl.searchParams.get("next");
  const fallbackLocale = getFallbackLocale(request, rawNextPath);
  const nextPath = sanitizeAuthNextPath(rawNextPath, getLocalizedPathname(fallbackLocale, "/perfumes"));
  const successRedirect = NextResponse.redirect(new URL(nextPath, requestUrl.origin));

  let supabase;
  try {
    supabase = createRouteHandlerClient(request, successRedirect);
  } catch {
    return NextResponse.redirect(
      buildAuthErrorRedirect(requestUrl, fallbackLocale, rawNextPath, nextPath, "auth_not_configured"),
    );
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        buildAuthErrorRedirect(requestUrl, fallbackLocale, rawNextPath, nextPath, "auth_callback_failed"),
      );
    }

    return successRedirect;
  }

  if (tokenHash && isOtpType(type)) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (error) {
      return NextResponse.redirect(
        buildAuthErrorRedirect(requestUrl, fallbackLocale, rawNextPath, nextPath, "email_verification_failed"),
      );
    }

    return successRedirect;
  }

  return NextResponse.redirect(
    buildAuthErrorRedirect(requestUrl, fallbackLocale, rawNextPath, nextPath, "invalid_auth_callback"),
  );
}
