import { cookies } from "next/headers";
import { Analytics } from "@vercel/analytics/next";

import { defaultLocale, hasLocale, localeCookieName } from "@/lib/i18n";

import "./globals.css";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(localeCookieName)?.value;
  const locale = cookieLocale && hasLocale(cookieLocale) ? cookieLocale : defaultLocale;

  return (
    <html lang={locale}>
      <body suppressHydrationWarning className="antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
