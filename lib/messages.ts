import type { AbstractIntlMessages } from "next-intl";

import { type AppLocale } from "@/lib/i18n";

type LocaleMessages = Record<string, unknown>;

const messageLoaders: Record<AppLocale, () => Promise<{ default: LocaleMessages }>> = {
  en: () => import("@/messages/en.json"),
  it: () => import("@/messages/it.json"),
};

function getNestedValue(
  source: LocaleMessages,
  segments: string[],
): unknown {
  let current: unknown = source;

  for (const segment of segments) {
    if (!current || typeof current !== "object" || !(segment in current)) {
      return undefined;
    }

    current = (current as Record<string, unknown>)[segment];
  }

  return current;
}

function setNestedValue(
  target: Record<string, unknown>,
  segments: string[],
  value: unknown,
) {
  let current = target;

  for (const segment of segments.slice(0, -1)) {
    const next = current[segment];

    if (!next || typeof next !== "object" || Array.isArray(next)) {
      current[segment] = {};
    }

    current = current[segment] as Record<string, unknown>;
  }

  current[segments[segments.length - 1]!] = value;
}

export async function getLocaleMessages(locale: AppLocale): Promise<AbstractIntlMessages> {
  return (await messageLoaders[locale]()).default as AbstractIntlMessages;
}

export function pickMessages(
  messages: LocaleMessages,
  namespaces: string[],
): AbstractIntlMessages {
  const scoped: Record<string, unknown> = {};

  for (const namespace of namespaces) {
    const segments = namespace.split(".").filter(Boolean);
    const value = getNestedValue(messages, segments);

    if (value !== undefined) {
      setNestedValue(scoped, segments, value);
    }
  }

  return scoped as AbstractIntlMessages;
}

export async function getScopedMessages(
  locale: AppLocale,
  namespaces: string[],
): Promise<AbstractIntlMessages> {
  return pickMessages(await getLocaleMessages(locale), namespaces);
}
