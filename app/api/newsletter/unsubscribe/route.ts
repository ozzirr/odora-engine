import { NextResponse } from "next/server";

import {
  isValidNewsletterToken,
  normalizeNewsletterEmail,
  unsubscribeFromNewsletter,
} from "@/lib/newsletter";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = normalizeNewsletterEmail(searchParams.get("email") ?? "");
  const token = searchParams.get("token") ?? "";

  if (!email || !token || !isValidNewsletterToken(email, token)) {
    return NextResponse.json({ error: "Invalid unsubscribe link." }, { status: 400 });
  }

  const result = await unsubscribeFromNewsletter(email);
  if (!result.ok) {
    return NextResponse.json({ error: "Unsubscribe is temporarily unavailable." }, { status: 503 });
  }

  return new NextResponse(
    "<!doctype html><html><body style=\"font-family:Arial,sans-serif;padding:32px;\"><h1>Odora</h1><p>You have been unsubscribed.</p></body></html>",
    {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    },
  );
}
