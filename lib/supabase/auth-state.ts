import type { User } from "@supabase/supabase-js";

import { getSupabaseEnvOrNull } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

function getUserDisplayName(user: User | null) {
  if (!user) {
    return null;
  }

  const metadataName = user.user_metadata?.name;
  if (typeof metadataName === "string" && metadataName.trim()) {
    return metadataName.trim();
  }

  const metadataFullName = user.user_metadata?.full_name;
  if (typeof metadataFullName === "string" && metadataFullName.trim()) {
    return metadataFullName.trim();
  }

  if (typeof user.email === "string" && user.email.includes("@")) {
    return user.email.split("@")[0];
  }

  return null;
}

export async function getCurrentUser() {
  if (!getSupabaseEnvOrNull()) {
    return null;
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      return null;
    }

    return user ?? null;
  } catch {
    return null;
  }
}

export async function getIsAuthenticated() {
  return Boolean(await getCurrentUser());
}

export async function getCurrentUserSummary() {
  const user = await getCurrentUser();

  return {
    isAuthenticated: Boolean(user),
    email: user?.email ?? null,
    displayName: getUserDisplayName(user),
  };
}
