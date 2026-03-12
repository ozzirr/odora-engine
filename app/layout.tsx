import { defaultLocale } from "@/lib/i18n";

import "./globals.css";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={defaultLocale}>
      <body suppressHydrationWarning className="antialiased">{children}</body>
    </html>
  );
}
