import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import {
  PUBLIC_CACHE_TAGS,
  getPerfumeDetailTag,
  isPublicCacheTag,
} from "@/lib/cache-tags";

type RevalidatePayload = Partial<{
  tags: unknown;
  perfumeSlugs: unknown;
}>;

function readBearerToken(request: Request) {
  const authorization = request.headers.get("authorization")?.trim();

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim();
}

function normalizeStringList(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item): item is string => item.length > 0);
}

export async function POST(request: Request) {
  const expectedToken = process.env.ODORA_REVALIDATE_TOKEN?.trim();

  if (!expectedToken) {
    return NextResponse.json(
      { error: "ODORA_REVALIDATE_TOKEN is not configured." },
      { status: 500 },
    );
  }

  if (readBearerToken(request) !== expectedToken) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => ({}))) as RevalidatePayload;
  const requestedTags = normalizeStringList(payload.tags).filter(isPublicCacheTag);
  const perfumeSlugs = normalizeStringList(payload.perfumeSlugs);
  const tagsToRevalidate = new Set<string>(
    requestedTags.length > 0 ? requestedTags : [PUBLIC_CACHE_TAGS.catalog],
  );

  for (const tag of tagsToRevalidate) {
    revalidateTag(tag, "max");
  }

  for (const slug of perfumeSlugs) {
    revalidateTag(getPerfumeDetailTag(slug), "max");
  }

  return NextResponse.json({
    revalidated: [...tagsToRevalidate],
    perfumeSlugs,
    count: tagsToRevalidate.size + perfumeSlugs.length,
  });
}
