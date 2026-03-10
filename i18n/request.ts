import { getRequestConfig } from "next-intl/server";

import { defaultLocale, hasLocale } from "@/lib/i18n";

export default getRequestConfig(async ({ requestLocale }) => {
  const requestedLocale = await requestLocale;
  const locale = requestedLocale && hasLocale(requestedLocale) ? requestedLocale : defaultLocale;

  return {
    locale,
    messages: (await import(`@/messages/${locale}.json`)).default,
  };
});
