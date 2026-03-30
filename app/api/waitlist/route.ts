import { NextResponse } from "next/server";

import { defaultLocale, hasLocale, type AppLocale } from "@/lib/i18n";

type WaitlistPayload = Partial<{
  email: unknown;
  locale: unknown;
}>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as WaitlistPayload;
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const locale =
    typeof payload.locale === "string" && hasLocale(payload.locale)
      ? (payload.locale as AppLocale)
      : defaultLocale;

  if (!emailPattern.test(email)) {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
  }

  const webhookUrl = process.env.WAITLIST_WEBHOOK_URL?.trim();

  if (webhookUrl) {
    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        email,
        locale,
        source: "odora-prelaunch-waitlist",
        submittedAt: new Date().toISOString(),
      }),
      cache: "no-store",
    }).catch(() => null);

    if (!webhookResponse?.ok) {
      return NextResponse.json({ error: "Waitlist submission failed." }, { status: 502 });
    }
  } else {
    console.info(`[waitlist] ${email} locale=${locale}`);
  }

  return NextResponse.json({ ok: true });
}
