function stripTrailingSlashes(value: string) {
  return value.replace(/\/+$/, "");
}

function normalizeOrigin(value: string) {
  const trimmed = stripTrailingSlashes(value.trim());
  if (!trimmed) {
    return null;
  }

  return trimmed.startsWith("http://") || trimmed.startsWith("https://")
    ? trimmed
    : `https://${trimmed}`;
}

export function getBaseSiteUrl() {
  const explicit = normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL ?? "");
  if (explicit) {
    return explicit;
  }

  const production = normalizeOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "");
  if (production) {
    return production;
  }

  const deployment = normalizeOrigin(process.env.VERCEL_URL ?? "");
  if (deployment) {
    return deployment;
  }

  return "http://localhost:3000";
}

export function getBaseSiteHost() {
  try {
    return new URL(getBaseSiteUrl()).host;
  } catch {
    return null;
  }
}
