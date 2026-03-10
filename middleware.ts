import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";

import {
  getLocaleFromAcceptLanguage,
  localeCookieName,
  routing,
} from "@/lib/i18n";
import { updateSession } from "@/lib/supabase/middleware";

const handleI18nRouting = createMiddleware(routing);

export async function middleware(request: NextRequest) {
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
  return updateSession(request, response);
}

export const config = {
  matcher: ["/((?!api|auth/callback|_next|.*\\..*).*)"],
};
