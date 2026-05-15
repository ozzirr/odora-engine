import { NextResponse } from "next/server";

import { getCatalogVisibilityWhere } from "@/lib/catalog";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";

export async function GET(request: Request) {
  if (!isDatabaseConfigured) {
    return NextResponse.json({ results: [] });
  }

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const visibilityWhere = getCatalogVisibilityWhere();

  try {
    const perfumes = await prisma.perfume.findMany({
      where: {
        ...visibilityWhere,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { brand: { name: { contains: q, mode: "insensitive" } } },
        ],
      },
      select: {
        id: true,
        slug: true,
        name: true,
        fragranceFamily: true,
        imageUrl: true,
        brand: { select: { name: true } },
      },
      orderBy: { ratingInternal: "desc" },
      take: 8,
    });

    return NextResponse.json({ results: perfumes });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
