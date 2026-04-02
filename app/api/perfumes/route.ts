import { NextResponse } from "next/server";

import { getPerfumesPage, PERFUMES_PAGE_SIZE } from "@/lib/perfumes-catalog";
import { getIsAuthenticated } from "@/lib/supabase/auth-state";

function parsePositiveInt(value: string | null | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }

  return parsed;
}

function toSearchParamsObject(searchParams: URLSearchParams) {
  const output: Record<string, string> = {};

  for (const [key, value] of searchParams.entries()) {
    if (key === "offset" || key === "limit") {
      continue;
    }
    output[key] = value;
  }

  return output;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const offset = parsePositiveInt(url.searchParams.get("offset"), 0);
  const limit = parsePositiveInt(url.searchParams.get("limit"), PERFUMES_PAGE_SIZE);
  const searchParams = toSearchParamsObject(url.searchParams);
  const isAuthenticated = await getIsAuthenticated();

  const result = await getPerfumesPage(searchParams, {
    offset,
    limit,
    accessMode: isAuthenticated ? "full" : "preview",
  });

  return NextResponse.json({
    perfumes: result.perfumes,
    total: result.total,
    hasMore: result.hasMore,
    nextOffset: result.offset + result.perfumes.length,
  });
}
