import { type NextRequest, NextResponse } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const pathname = request.nextUrl.pathname;

  // Serve ads.txt directly on non-www domain without redirecting
  // (AdSense crawler does not follow redirects for ads.txt)
  if (pathname === "/ads.txt") {
    return NextResponse.next();
  }

  // Redirect non-www to www
  if (host === "odora.it") {
    const url = request.nextUrl.clone();
    url.host = "www.odora.it";
    return NextResponse.redirect(url, 308);
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/ads.txt",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
