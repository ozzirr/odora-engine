import { getSupabaseEnvOrNull } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export async function getIsAuthenticated() {
  if (!getSupabaseEnvOrNull()) {
    return false;
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      return false;
    }

    return Boolean(user);
  } catch {
    return false;
  }
}
