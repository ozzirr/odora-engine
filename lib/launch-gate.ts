import {
  defaultLocale,
  getLocalizedPathname,
  hasLocale,
  type AppLocale,
} from "@/lib/i18n";

export const LAUNCH_GATE_ACCESS_COOKIE_NAME = "odora_preview_access";

const LAUNCH_GATE_ACCESS_COOKIE_VERSION = "v1";
const textEncoder = new TextEncoder();

function timingSafeEqualString(left: string, right: string) {
  if (left.length !== right.length) {
    return false;
  }

  let mismatch = 0;

  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return mismatch === 0;
}

function toHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function getLaunchGateSignature(secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, textEncoder.encode("odora-launch-gate-access"));
  return toHex(new Uint8Array(signature));
}

export function isLaunchGateEnabled() {
  const raw = process.env.ODORA_PRELAUNCH_MODE?.trim().toLowerCase();
  return raw === "true" || raw === "1" || raw === "on";
}

export function getLaunchGatePassword() {
  const value = process.env.ODORA_SITE_PASSWORD?.trim();
  return value || null;
}

export function isLaunchGateConfigured() {
  return Boolean(getLaunchGatePassword());
}

export async function hasLaunchGateAccess(value: string | null | undefined) {
  const secret = getLaunchGatePassword();
  if (!secret || !value) {
    return false;
  }

  const [version, signature] = value.split(".", 2);
  if (version !== LAUNCH_GATE_ACCESS_COOKIE_VERSION || !signature) {
    return false;
  }

  return timingSafeEqualString(signature, await getLaunchGateSignature(secret));
}

export async function getLaunchGateAccessCookieValue() {
  const secret = getLaunchGatePassword();

  if (!secret) {
    return null;
  }

  return `${LAUNCH_GATE_ACCESS_COOKIE_VERSION}.${await getLaunchGateSignature(secret)}`;
}

export async function isValidLaunchGatePassword(candidate: string) {
  const secret = getLaunchGatePassword();
  if (!secret) {
    return false;
  }

  return timingSafeEqualString(candidate, secret);
}

export function getLaunchGateCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  };
}

export function getLaunchGateLocaleFromPathname(pathname: string): AppLocale {
  const firstSegment = pathname.split("/").filter(Boolean)[0];
  return firstSegment && hasLocale(firstSegment) ? firstSegment : defaultLocale;
}

export function isLaunchGateHomePath(pathname: string) {
  const locale = getLaunchGateLocaleFromPathname(pathname);
  return pathname === `/${locale}` || pathname === `/${locale}/`;
}

export function getLaunchGateRedirectPath(locale: AppLocale) {
  return getLocalizedPathname(locale, "/perfumes");
}
