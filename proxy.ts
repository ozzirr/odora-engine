import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";

import {
  getLocaleFromAcceptLanguage,
  getLocalizedPathname,
  localeCookieName,
  routing,
} from "@/lib/i18n";
import {
  LAUNCH_GATE_ACCESS_COOKIE_NAME,
  getLaunchGateLocaleFromPathname,
  hasLaunchGateAccess,
  isLaunchGateEnabled,
  isLaunchGateHomePath,
} from "@/lib/launch-gate";
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
  const hasLocalePrefix = routing.locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );

  if (!hasLocalePrefix) {
    request.cookies.set(
      localeCookieName,
      getLocaleFromAcceptLanguage(request.headers.get("accept-language")),
    );
  }

  const response = handleI18nRouting(request);

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
