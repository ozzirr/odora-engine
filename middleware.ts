import createIntlMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { locales, resolvePublicEntryLocale, routing } from "@/lib/i18n";
import { updateSession } from "@/lib/supabase/middleware";

const intlMiddleware = createIntlMiddleware(routing);

function hasLocalePrefix(pathname: string) {
  return locales.some((locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`));
}

function getRequestCountry(request: NextRequest) {
  return request.headers.get("x-vercel-ip-country") ?? request.headers.get("cf-ipcountry");
}

export async function middleware(request: NextRequest) {
  if (!hasLocalePrefix(request.nextUrl.pathname)) {
    const locale = resolvePublicEntryLocale({
      country: getRequestCountry(request),
      acceptLanguage: request.headers.get("accept-language"),
    });
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = request.nextUrl.pathname === "/" ? `/${locale}` : `/${locale}${request.nextUrl.pathname}`;
    const response = NextResponse.redirect(redirectUrl);
    return await updateSession(request, response);
  }

  const response = intlMiddleware(request);
  return await updateSession(request, response);
}

export const config = {
  matcher: [
    "/((?!api/|auth/callback|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|ads.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
