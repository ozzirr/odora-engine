function readSupabaseUrl() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!value) {
    throw new Error("Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL");
  }

  return value;
}

function readSupabasePublishableKey() {
  const value =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!value) {
    throw new Error(
      "Missing required environment variable: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  return value;
}

export function getSupabaseEnv() {
  return {
    url: readSupabaseUrl(),
    publishableKey: readSupabasePublishableKey(),
  };
}

export function getSupabaseEnvOrNull() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !publishableKey) {
    return null;
  }

  return {
    url,
    publishableKey,
  };
}

export function getBaseSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/+$/, "");
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    return `https://${vercelUrl.replace(/\/+$/, "")}`;
  }

  return "http://localhost:3000";
}
