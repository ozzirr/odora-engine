const AUTH_PATH_SEGMENTS = new Set(["login", "signup", "accedi", "registrati"]);

function getPathname(value: string) {
  try {
    return new URL(value, "https://odora.app").pathname;
  } catch {
    return value;
  }
}

export function isAuthPath(value: string) {
  const pathname = getPathname(value).replace(/\/+$/, "");
  const lastSegment = pathname.split("/").filter(Boolean).at(-1)?.toLowerCase();
  return lastSegment ? AUTH_PATH_SEGMENTS.has(lastSegment) : false;
}

export function sanitizeAuthNextPath(value: string | null | undefined, fallbackPath: string) {
  if (!value) {
    return fallbackPath;
  }

  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallbackPath;
  }

  if (isAuthPath(trimmed)) {
    return fallbackPath;
  }

  return trimmed;
}
