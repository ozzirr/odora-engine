import { createHash } from "node:crypto";

type HeaderAccessor = Pick<Headers, "get">;

function readForwardedFor(headers: HeaderAccessor) {
  const forwardedFor = headers.get("x-forwarded-for");
  if (!forwardedFor) {
    return null;
  }

  const firstIp = forwardedFor
    .split(",")
    .map((value) => value.trim())
    .find(Boolean);

  return firstIp || null;
}

export function getClientIp(headers: HeaderAccessor) {
  return (
    readForwardedFor(headers) ||
    headers.get("x-real-ip")?.trim() ||
    headers.get("cf-connecting-ip")?.trim() ||
    headers.get("x-vercel-forwarded-for")?.trim() ||
    "unknown"
  );
}

export function buildRateLimitIdentity(parts: Array<string | null | undefined>) {
  const serialized = parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join("|");

  return createHash("sha256").update(serialized || "unknown").digest("hex");
}
