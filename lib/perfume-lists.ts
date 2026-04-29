import type { User as SupabaseUser } from "@supabase/supabase-js";

import { prisma } from "@/lib/prisma";

export type PerfumeListVisibilityValue = "PRIVATE" | "PUBLIC";

export type UserPerfumeListSummary = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  visibility: PerfumeListVisibilityValue;
  itemCount: number;
  items: Array<{
    id: number;
    perfumeId: number;
    perfume: {
      id: number;
      slug: string;
      name: string;
      imageUrl: string | null;
      fragranceFamily: string;
      brand: {
        name: string;
      };
    };
  }>;
};

export type UserPerfumeListForPerfume = UserPerfumeListSummary & {
  containsPerfume: boolean;
};

export function slugifyListName(value: string) {
  const slug = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return slug || "lista-profumi";
}

export function getUserDisplayNameFromSupabase(user: SupabaseUser) {
  const metadataName = user.user_metadata?.name;
  if (typeof metadataName === "string" && metadataName.trim()) {
    return metadataName.trim();
  }

  const metadataFullName = user.user_metadata?.full_name;
  if (typeof metadataFullName === "string" && metadataFullName.trim()) {
    return metadataFullName.trim();
  }

  return user.email?.split("@")[0] ?? "Odora user";
}

export async function ensureAppUser(user: SupabaseUser) {
  return prisma.user.upsert({
    where: { id: user.id },
    update: {
      email: user.email ?? null,
      name: getUserDisplayNameFromSupabase(user),
    },
    create: {
      id: user.id,
      email: user.email ?? null,
      name: getUserDisplayNameFromSupabase(user),
    },
  });
}

export async function getUniqueListSlug(userId: string, name: string, currentListId?: number) {
  const baseSlug = slugifyListName(name);
  let candidate = baseSlug;
  let suffix = 2;

  while (true) {
    const existing = await prisma.perfumeList.findFirst({
      where: {
        userId,
        slug: candidate,
        ...(currentListId ? { id: { not: currentListId } } : {}),
      },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }

    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

export async function getUserPerfumeLists(userId: string): Promise<UserPerfumeListSummary[]> {
  const lists = await prisma.perfumeList.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      items: {
        orderBy: [{ position: "asc" }, { createdAt: "desc" }],
        select: {
          id: true,
          perfumeId: true,
          perfume: {
            select: {
              id: true,
              slug: true,
              name: true,
              imageUrl: true,
              fragranceFamily: true,
              brand: {
                select: { name: true },
              },
            },
          },
        },
      },
      _count: {
        select: { items: true },
      },
    },
  });

  return lists.map((list) => ({
    id: list.id,
    name: list.name,
    slug: list.slug,
    description: list.description,
    visibility: list.visibility,
    itemCount: list._count.items,
    items: list.items,
  }));
}

export async function getUserPerfumeListsForPerfume(
  userId: string,
  perfumeId: number,
): Promise<UserPerfumeListForPerfume[]> {
  const lists = await prisma.perfumeList.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      items: {
        where: { perfumeId },
        select: { id: true },
      },
      _count: {
        select: { items: true },
      },
    },
  });

  return lists.map((list) => ({
    id: list.id,
    name: list.name,
    slug: list.slug,
    description: list.description,
    visibility: list.visibility,
    itemCount: list._count.items,
    items: [],
    containsPerfume: list.items.length > 0,
  }));
}

export function getPublicListKey(list: { id: number; slug: string }) {
  return `${list.id}-${list.slug}`;
}

export function parsePublicListKey(value: string) {
  const match = value.match(/^(\d+)(?:-(.+))?$/);
  if (!match) {
    return null;
  }

  return {
    id: Number.parseInt(match[1], 10),
    slug: match[2] ?? "",
  };
}
