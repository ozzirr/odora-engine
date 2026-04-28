"use server";

import { revalidatePath } from "next/cache";

import { followBrand, unfollowBrand } from "@/lib/brand-follows";
import { ensureAppUser } from "@/lib/perfume-lists";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/supabase/auth-state";

type ToggleResult = { ok: true; following: boolean } | { ok: false; error: string };

export async function toggleBrandFollow(brandId: number): Promise<ToggleResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  await ensureAppUser(user);

  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
    select: { id: true, slug: true },
  });
  if (!brand) return { ok: false, error: "not_found" };

  const existing = await prisma.brandFollow.findUnique({
    where: { userId_brandId: { userId: user.id, brandId: brand.id } },
    select: { id: true },
  });

  if (existing) {
    await unfollowBrand(user.id, brand.id);
    revalidatePath(`/brands/${brand.slug}`);
    return { ok: true, following: false };
  }

  await followBrand(user.id, brand.id);
  revalidatePath(`/brands/${brand.slug}`);
  return { ok: true, following: true };
}
