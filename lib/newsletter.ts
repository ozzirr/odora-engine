import { createHash } from "node:crypto";
import { createHmac, timingSafeEqual } from "node:crypto";

import { CONSENT_VERSION } from "@/lib/privacy/consent";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import type { AppLocale } from "@/lib/i18n";

export const MARKETING_CONSENT_TEXT =
  "I agree to receive Odora marketing emails, product updates, and newsletter content. I can unsubscribe at any time.";

const MAX_USER_AGENT_LENGTH = 500;

export type NewsletterSource = "signup" | "api";

export type SubscribeNewsletterInput = {
  email: string;
  locale?: AppLocale;
  source: NewsletterSource;
  ip?: string;
  userAgent?: string | null;
};

export type SubscribeNewsletterResult =
  | { ok: true }
  | { ok: false; error: "database_unavailable" | "invalid_email" | "unexpected" };

export function normalizeNewsletterEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isValidNewsletterEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getNewsletterTokenSecret() {
  return (
    process.env.ODORA_NEWSLETTER_TOKEN_SECRET?.trim() ||
    process.env.ODORA_CRON_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    process.env.RESEND_API_KEY?.trim() ||
    "odora-local-newsletter-token"
  );
}

export function createNewsletterToken(email: string) {
  return createHmac("sha256", getNewsletterTokenSecret())
    .update(normalizeNewsletterEmail(email))
    .digest("hex");
}

export function isValidNewsletterToken(email: string, token: string) {
  const expected = createNewsletterToken(email);
  const expectedBuffer = Buffer.from(expected, "hex");
  const tokenBuffer = Buffer.from(token, "hex");

  return tokenBuffer.length === expectedBuffer.length && timingSafeEqual(tokenBuffer, expectedBuffer);
}

function hashIp(ip: string | undefined) {
  const normalized = ip?.trim();
  if (!normalized || normalized === "unknown") {
    return null;
  }

  return createHash("sha256").update(normalized).digest("hex");
}

function normalizeUserAgent(userAgent: string | null | undefined) {
  const value = userAgent?.trim();
  return value ? value.slice(0, MAX_USER_AGENT_LENGTH) : null;
}

export async function subscribeToNewsletter({
  email,
  locale,
  source,
  ip,
  userAgent,
}: SubscribeNewsletterInput): Promise<SubscribeNewsletterResult> {
  const normalizedEmail = normalizeNewsletterEmail(email);

  if (!isValidNewsletterEmail(normalizedEmail)) {
    return { ok: false, error: "invalid_email" };
  }

  if (!isDatabaseConfigured) {
    return { ok: false, error: "database_unavailable" };
  }

  try {
    await prisma.newsletterSubscriber.upsert({
      where: {
        email: normalizedEmail,
      },
      create: {
        email: normalizedEmail,
        locale: locale ?? null,
        source,
        consentVersion: CONSENT_VERSION,
        consentText: MARKETING_CONSENT_TEXT,
        ipHash: hashIp(ip),
        userAgent: normalizeUserAgent(userAgent),
      },
      update: {
        locale: locale ?? null,
        source,
        status: "SUBSCRIBED",
        consentVersion: CONSENT_VERSION,
        consentText: MARKETING_CONSENT_TEXT,
        consentedAt: new Date(),
        unsubscribedAt: null,
        lastSubmittedAt: new Date(),
        ipHash: hashIp(ip),
        userAgent: normalizeUserAgent(userAgent),
      },
    });

    return { ok: true };
  } catch (error) {
    console.error("Failed to subscribe newsletter email", error);
    return { ok: false, error: "unexpected" };
  }
}

export async function unsubscribeFromNewsletter(email: string) {
  const normalizedEmail = normalizeNewsletterEmail(email);

  if (!isValidNewsletterEmail(normalizedEmail)) {
    return { ok: false as const, error: "invalid_email" as const };
  }

  if (!isDatabaseConfigured) {
    return { ok: false as const, error: "database_unavailable" as const };
  }

  try {
    await prisma.newsletterSubscriber.updateMany({
      where: { email: normalizedEmail },
      data: {
        status: "UNSUBSCRIBED",
        unsubscribedAt: new Date(),
      },
    });

    return { ok: true as const };
  } catch (error) {
    console.error("Failed to unsubscribe newsletter email", error);
    return { ok: false as const, error: "unexpected" as const };
  }
}
