import { NextIntlClientProvider } from "next-intl";

import { type AppLocale } from "@/lib/i18n";
import { getScopedMessages } from "@/lib/messages";

type ScopedIntlProviderProps = {
  children: React.ReactNode;
  locale: AppLocale;
  namespaces: string[];
};

export async function ScopedIntlProvider({
  children,
  locale,
  namespaces,
}: ScopedIntlProviderProps) {
  const messages = await getScopedMessages(locale, namespaces);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
