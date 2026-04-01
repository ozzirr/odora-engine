import { localeCookieName } from "@/lib/i18n";
import { LAUNCH_GATE_ACCESS_COOKIE_NAME } from "@/lib/launch-gate";

export const PRIVACY_MODE = "lightweight" as const;
export const CONSENT_COOKIE_NAME = "odora_consent";
export const CONSENT_VERSION = "v1";
export const CONSENT_COOKIE_MAX_AGE = 60 * 60 * 24 * 180;
export const PRIVACY_DISCLOSURE_UPDATED_AT = "2026-04-01T00:00:00.000Z";

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
  title: string;
  description: string;
  statusLabel: string;
  active: boolean;
  alwaysOn?: boolean;
};

export type PrivacyServiceDefinition = {
  id: string;
  category: ConsentCategory;
  label: string;
  provider: string;
  purpose: string;
  storage: string;
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
    title: "Cookie tecnici / necessari",
    description:
      "Servono per login, sessione, lingua e protezione delle aree riservate. Restano sempre attivi perché richiesti dal funzionamento del sito.",
    statusLabel: "Sempre attivi",
    active: true,
    alwaysOn: true,
  },
  {
    key: "analytics",
    title: "Analytics privacy-friendly",
    description:
      "Usiamo Vercel Web Analytics per leggere trend aggregati di utilizzo, senza strumenti di remarketing o profilazione pubblicitaria.",
    statusLabel: "Attivi",
    active: true,
  },
  {
    key: "marketing",
    title: "Cookie di marketing / profilazione",
    description:
      "Al momento non sono attivi pixel pubblicitari, tag manager marketing, chat widget o strumenti di remarketing nel frontend.",
    statusLabel: "Non attivi",
    active: false,
  },
];

export const privacyServices: PrivacyServiceDefinition[] = [
  {
    id: "supabase-auth",
    category: "necessary",
    label: "Supabase Auth / sessione",
    provider: "Supabase",
    purpose:
      "Mantiene l'accesso all'account, rinnova la sessione e protegge le aree che richiedono autenticazione.",
    storage:
      "Cookie HTTP-only di sessione gestiti da Supabase SSR per autenticazione e refresh del token.",
    cookieNames: [getSupabaseCookiePattern()],
    active: true,
    alwaysOn: true,
  },
  {
    id: "locale",
    category: "necessary",
    label: "Preferenza lingua",
    provider: "Odora / next-intl",
    purpose:
      "Ricorda la lingua selezionata così il sito può restare coerente tra pagine e redirect locali.",
    storage: "Cookie first-party con preferenza di lingua.",
    cookieNames: [localeCookieName],
    active: true,
    alwaysOn: true,
  },
  {
    id: "launch-gate",
    category: "necessary",
    label: "Accesso preview",
    provider: "Odora",
    purpose:
      "Viene usato solo quando la preview privata è attiva, per ricordare che l'accesso protetto è stato autorizzato.",
    storage: "Cookie first-party tecnico impostato solo in modalità preview.",
    cookieNames: [LAUNCH_GATE_ACCESS_COOKIE_NAME],
    active: true,
    alwaysOn: true,
  },
  {
    id: "vercel-analytics",
    category: "analytics",
    label: "Vercel Web Analytics",
    provider: "Vercel",
    purpose:
      "Aiuta a capire in forma aggregata quali pagine vengono usate di più e come migliora l'esperienza complessiva del sito.",
    storage:
      "Misurazioni aggregate fornite da Vercel Analytics; nessun cookie di marketing o remarketing è attivo nel progetto.",
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

export function getPrivacyServices(category: ConsentCategory) {
  return privacyServices.filter((service) => service.category === category);
}
