import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { AdsenseScript } from "@/components/privacy/AdsenseScript";
import { getBaseSiteUrl } from "@/lib/site-url";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(getBaseSiteUrl()),
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: ["/icon.svg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className="antialiased">
        {children}
        <AdsenseScript />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
