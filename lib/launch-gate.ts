import {
  defaultLocale,
  getLocalizedPathname,
  hasLocale,
  type AppLocale,
} from "@/lib/i18n";

export const LAUNCH_GATE_ACCESS_COOKIE_NAME = "odora_preview_access";

const LAUNCH_GATE_ACCESS_COOKIE_VALUE = "granted";
const DEFAULT_LAUNCH_GATE_PASSWORD = "odora";

export function isLaunchGateEnabled() {
  const raw = process.env.ODORA_PRELAUNCH_MODE?.trim().toLowerCase();
  return raw === "true" || raw === "1" || raw === "on";
}

export function hasLaunchGateAccess(value: string | null | undefined) {
  return value === LAUNCH_GATE_ACCESS_COOKIE_VALUE;
}

export function getLaunchGateAccessCookieValue() {
  return LAUNCH_GATE_ACCESS_COOKIE_VALUE;
}

export function getLaunchGatePassword() {
  return process.env.ODORA_SITE_PASSWORD?.trim() || DEFAULT_LAUNCH_GATE_PASSWORD;
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
