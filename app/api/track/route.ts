import { NextResponse } from "next/server";

import { isAllowedAmazonHostname } from "@/lib/amazon";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  const slug = searchParams.get("slug") ?? undefined;
  const type = searchParams.get("type") ?? "amazon";
  const locale = searchParams.get("locale") ?? undefined;

  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  let destination: URL;
  try {
    destination = new URL(url);
    if (destination.protocol !== "http:" && destination.protocol !== "https:") {
      return NextResponse.json({ error: "Invalid url" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  if (type !== "amazon") {
    return NextResponse.json({ error: "Unsupported destination" }, { status: 400 });
  }

  if (!isAllowedAmazonHostname(destination.hostname)) {
    return NextResponse.json({ error: "Destination not allowed" }, { status: 400 });
  }

  if (isDatabaseConfigured) {
    prisma.affiliateClick
      .create({
        data: {
          perfumeSlug: slug ?? null,
          destination: type,
          targetUrl: url,
          locale: locale ?? null,
        },
      })
      .catch(() => {
        // ignore logging errors — never block the redirect
      });
  }

  return NextResponse.redirect(destination.toString(), { status: 302 });
}
