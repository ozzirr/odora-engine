import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";

import {
  getLocalizedPathname,
  localeCookieName,
  resolveRequestLocale,
  routing,
} from "@/lib/i18n";
import {
  LAUNCH_GATE_ACCESS_COOKIE_NAME,
  getLaunchGateLocaleFromPathname,
  hasLaunchGateAccess,
  isLaunchGateEnabled,
  isLaunchGateHomePath,
} from "@/lib/launch-gate";
import { getBaseSiteHost } from "@/lib/site-url";
import { updateSession } from "@/lib/supabase/middleware";

const handleI18nRouting = createMiddleware(routing);
const sessionAwareRoutes = [
  "/en/login",
  "/it/accedi",
  "/en/signup",
  "/it/registrati",
  "/en/profile",
  "/it/profilo",
];

function requiresSessionRefresh(pathname: string) {
  return sessionAwareRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const canonicalHost = getBaseSiteHost();
  const requestHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ?? request.headers.get("host");
  const resolvedLocale = resolveRequestLocale({
    cookieLocale: request.cookies.get(localeCookieName)?.value,
    acceptLanguage: request.headers.get("accept-language"),
    country:
      request.headers.get("x-vercel-ip-country") ??
      request.headers.get("x-country-code"),
  });
  const hasLocalePrefix = routing.locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );

  if (
    canonicalHost &&
    requestHost &&
    requestHost === `www.${canonicalHost}` &&
    request.nextUrl.protocol === "https:"
  ) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.host = canonicalHost;
    return NextResponse.redirect(redirectUrl, 308);
  }

  if (!hasLocalePrefix && pathname === "/") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = getLocalizedPathname(resolvedLocale, "/");

    const response = NextResponse.redirect(redirectUrl, 307);
    response.cookies.set(localeCookieName, resolvedLocale, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });

    return response;
  }

  const response = handleI18nRouting(request);

  if (!hasLocalePrefix) {
    response.cookies.set(localeCookieName, resolvedLocale, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  if (
    isLaunchGateEnabled() &&
    !hasLaunchGateAccess(request.cookies.get(LAUNCH_GATE_ACCESS_COOKIE_NAME)?.value) &&
    hasLocalePrefix &&
    !isLaunchGateHomePath(pathname)
  ) {
    const locale = getLaunchGateLocaleFromPathname(pathname);
    return NextResponse.redirect(new URL(getLocalizedPathname(locale, "/"), request.url));
  }

  if (!requiresSessionRefresh(pathname)) {
    return response;
  }

  return updateSession(request, response);
}

export const config = {
  matcher: ["/((?!api|auth/callback|_next|.*\\..*).*)"],
};
