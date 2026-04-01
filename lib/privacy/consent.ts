import { localeCookieName } from "@/lib/i18n";
import { LAUNCH_GATE_ACCESS_COOKIE_NAME } from "@/lib/launch-gate";

export const PRIVACY_MODE = "lightweight" as const;
export const CONSENT_COOKIE_NAME = "odora_consent";
export const CONSENT_VERSION = "v1";
export const CONSENT_COOKIE_MAX_AGE = 60 * 60 * 24 * 180;
export const PRIVACY_DISCLOSURE_UPDATED_AT = "2026-04-01T00:00:00.000Z";
export const PRIVACY_CONSENT_UPDATED_EVENT = "odora:privacy-consent-updated";
export const ADSENSE_ACCOUNT_ID = "pub-3711710548947054";
export const ADSENSE_CLIENT_ID = `ca-${ADSENSE_ACCOUNT_ID}`;

export type ConsentCategory = "necessary" | "analytics" | "marketing";

export type ConsentState = {
  version: string;
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
};

export type PrivacyCategoryDefinition = {
  key: ConsentCategory;
  active: boolean;
  alwaysOn?: boolean;
};

export type PrivacyServiceId =
  | "supabase-auth"
  | "locale"
  | "launch-gate"
  | "vercel-analytics"
  | "google-adsense";

export type PrivacyServiceDefinition = {
  id: PrivacyServiceId;
  category: ConsentCategory;
  provider: string;
  cookieNames: string[];
  active: boolean;
  alwaysOn?: boolean;
};

function getSupabaseProjectRef() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!value) {
    return null;
  }

  try {
    const hostname = new URL(value).hostname;
    return hostname.split(".")[0] || null;
  } catch {
    return null;
  }
}

function getSupabaseCookiePattern() {
  const projectRef = getSupabaseProjectRef();
  return projectRef ? `sb-${projectRef}-auth-token*` : "sb-*-auth-token*";
}

export const privacyCategories: PrivacyCategoryDefinition[] = [
  {
    key: "necessary",
    active: true,
    alwaysOn: true,
  },
  {
    key: "analytics",
    active: true,
  },
  {
    key: "marketing",
    active: true,
  },
];

export const privacyServices: PrivacyServiceDefinition[] = [
  {
    id: "supabase-auth",
    category: "necessary",
    provider: "Supabase",
    cookieNames: [getSupabaseCookiePattern()],
    active: true,
    alwaysOn: true,
  },
  {
    id: "locale",
    category: "necessary",
    provider: "Odora / next-intl",
    cookieNames: [localeCookieName],
    active: true,
    alwaysOn: true,
  },
  {
    id: "launch-gate",
    category: "necessary",
    provider: "Odora",
    cookieNames: [LAUNCH_GATE_ACCESS_COOKIE_NAME],
    active: true,
    alwaysOn: true,
  },
  {
    id: "vercel-analytics",
    category: "analytics",
    provider: "Vercel",
    cookieNames: [],
    active: true,
  },
  {
    id: "google-adsense",
    category: "marketing",
    provider: "Google",
    cookieNames: [],
    active: true,
  },
];

function isConsentRecord(value: unknown): value is ConsentState {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<ConsentState>;

  return (
    typeof candidate.version === "string" &&
    candidate.necessary === true &&
    typeof candidate.analytics === "boolean" &&
    typeof candidate.marketing === "boolean" &&
    typeof candidate.updatedAt === "string"
  );
}

export function createConsentState(
  consent: Partial<Pick<ConsentState, "analytics" | "marketing">> = {},
  updatedAt = PRIVACY_DISCLOSURE_UPDATED_AT,
): ConsentState {
  return {
    version: CONSENT_VERSION,
    necessary: true,
    analytics: consent.analytics ?? (PRIVACY_MODE === "lightweight"),
    marketing: consent.marketing ?? false,
    updatedAt,
  };
}

function parseConsent(raw: string | null | undefined) {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    return isConsentRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function readConsent(raw: string | null | undefined) {
  const parsed = parseConsent(raw);

  if (!parsed || parsed.version !== CONSENT_VERSION) {
    return createConsentState(
      {
        analytics: PRIVACY_MODE === "lightweight",
        marketing: false,
      },
      parsed?.updatedAt ?? PRIVACY_DISCLOSURE_UPDATED_AT,
    );
  }

  return parsed;
}

export function getCookieValue(cookieHeader: string | null | undefined, name: string) {
  if (!cookieHeader) {
    return null;
  }

  const prefix = `${name}=`;

  for (const segment of cookieHeader.split(";")) {
    const trimmed = segment.trim();

    if (!trimmed.startsWith(prefix)) {
      continue;
    }

    const value = trimmed.slice(prefix.length);

    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  return null;
}

export function readStoredConsent(cookieHeader: string | null | undefined) {
  return readConsent(getCookieValue(cookieHeader, CONSENT_COOKIE_NAME));
}

export function writeConsent(
  consent: Pick<ConsentState, "analytics" | "marketing">,
  updatedAt = new Date().toISOString(),
) {
  return JSON.stringify(createConsentState(consent, updatedAt));
}

export function isCategoryAllowed(
  category: ConsentCategory,
  input: ConsentState | string | null | undefined,
) {
  const consent = typeof input === "string" || input == null ? readConsent(input) : input;

  if (category === "necessary") {
    return true;
  }

  return category === "analytics" ? consent.analytics : consent.marketing;
}

export function hasConsentVersionMismatch(raw: string | null | undefined) {
  const parsed = parseConsent(raw);
  return Boolean(parsed && parsed.version !== CONSENT_VERSION);
}

export function getConsentCookieOptions() {
  return {
    name: CONSENT_COOKIE_NAME,
    maxAge: CONSENT_COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

export function buildConsentCookieString(
  consent: Pick<ConsentState, "analytics" | "marketing">,
  updatedAt = new Date().toISOString(),
) {
  const payload = encodeURIComponent(writeConsent(consent, updatedAt));
  const options = getConsentCookieOptions();

  return `${options.name}=${payload}; Max-Age=${options.maxAge}; Path=${options.path}; SameSite=${options.sameSite}${options.secure ? "; Secure" : ""}`;
}

export function persistConsentInBrowser(
  consent: Pick<ConsentState, "analytics" | "marketing">,
  updatedAt = new Date().toISOString(),
) {
  const nextConsent = createConsentState(consent, updatedAt);

  if (typeof document !== "undefined") {
    document.cookie = buildConsentCookieString(consent, updatedAt);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(PRIVACY_CONSENT_UPDATED_EVENT, {
        detail: nextConsent,
      }),
    );
  }

  return nextConsent;
}

export function getPrivacyServices(category: ConsentCategory) {
  return privacyServices.filter((service) => service.category === category);
}
