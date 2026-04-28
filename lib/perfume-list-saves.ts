import { prisma } from "@/lib/prisma";

export async function getListSaveCount(listId: number) {
  return prisma.perfumeListSave.count({ where: { listId } });
}

export async function isListSavedBy(listId: number, userId: string | null | undefined) {
  if (!userId) return false;
  const save = await prisma.perfumeListSave.findUnique({
    where: { userId_listId: { userId, listId } },
    select: { id: true },
  });
  return Boolean(save);
}

export async function getSavedListsForUser(userId: string) {
  return prisma.perfumeListSave.findMany({
    where: { userId },
    include: {
      list: {
        include: {
          user: { select: { id: true, name: true } },
          items: { select: { perfumeId: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
