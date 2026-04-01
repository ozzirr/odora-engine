import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { defaultLocale } from "@/lib/i18n";
import { getBaseSiteUrl } from "@/lib/site-url";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(getBaseSiteUrl()),
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={defaultLocale}>
      <body suppressHydrationWarning className="antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
