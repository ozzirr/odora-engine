import { prisma } from "@/lib/prisma";

export async function isFollowingBrand(userId: string, brandId: number) {
  const follow = await prisma.brandFollow.findUnique({
    where: { userId_brandId: { userId, brandId } },
    select: { id: true },
  });
  return Boolean(follow);
}

export async function followBrand(userId: string, brandId: number) {
  await prisma.brandFollow.upsert({
    where: { userId_brandId: { userId, brandId } },
    update: {},
    create: { userId, brandId },
  });
}

export async function unfollowBrand(userId: string, brandId: number) {
  await prisma.brandFollow
    .delete({ where: { userId_brandId: { userId, brandId } } })
    .catch(() => null);
}
