import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseEnv } from "@/lib/supabase/config";

let browserClient: SupabaseClient | null = null;

export function createClient() {
  if (browserClient) {
    return browserClient;
  }

  const { url, publishableKey } = getSupabaseEnv();
  browserClient = createBrowserClient(url, publishableKey);
  return browserClient;
}
