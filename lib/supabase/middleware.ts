import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseEnvOrNull } from "@/lib/supabase/config";

export async function updateSession(request: NextRequest, initialResponse?: NextResponse) {
  const response =
    initialResponse ??
    NextResponse.next({
      request,
    });

  const supabaseEnv = getSupabaseEnvOrNull();
  if (!supabaseEnv) {
    return response;
  }

  const { url, publishableKey } = supabaseEnv;

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }

        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  try {
    await supabase.auth.getUser();
  } catch {
    return response;
  }

  return response;
}
