import { ADSENSE_ACCOUNT_ID } from "@/lib/privacy/consent";

export const dynamic = "force-static";

export function GET() {
  return new Response(`google.com, ${ADSENSE_ACCOUNT_ID}, DIRECT, f08c47fec0942fa0\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
