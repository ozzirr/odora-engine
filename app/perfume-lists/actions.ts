"use server";

import { revalidatePath } from "next/cache";
import { PerfumeListVisibility } from "@prisma/client";

import {
  ensureAppUser,
  getUniqueListSlug,
  type PerfumeListVisibilityValue,
} from "@/lib/perfume-lists";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export type PerfumeListActionResult = {
  ok: boolean;
  error?: string;
  listId?: number;
};

type ListInput = {
  name: string;
  description?: string | null;
  visibility?: PerfumeListVisibilityValue;
};

async function getAuthenticatedAppUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Devi accedere per gestire le liste.");
  }

  return ensureAppUser(user);
}

function normalizeListInput(input: ListInput) {
  const name = input.name.trim();
  const description = input.description?.trim() || null;
  const visibility =
    input.visibility === "PUBLIC" ? PerfumeListVisibility.PUBLIC : PerfumeListVisibility.PRIVATE;

  if (name.length < 2) {
    throw new Error("Inserisci un nome lista valido.");
  }

  if (name.length > 80) {
    throw new Error("Il nome lista e troppo lungo.");
  }

  if (description && description.length > 240) {
    throw new Error("La descrizione e troppo lunga.");
  }

  return { name, description, visibility };
}

function revalidateListSurfaces() {
  revalidatePath("/", "layout");
  revalidatePath("/profile");
  revalidatePath("/lists/[listKey]", "page");
}

export async function createPerfumeList(input: ListInput): Promise<PerfumeListActionResult> {
  try {
    const user = await getAuthenticatedAppUser();
    const data = normalizeListInput(input);
    const slug = await getUniqueListSlug(user.id, data.name);
    const list = await prisma.perfumeList.create({
      data: {
        ...data,
        slug,
        userId: user.id,
      },
      select: { id: true },
    });

    revalidateListSurfaces();
    return { ok: true, listId: list.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Impossibile creare la lista." };
  }
}

export async function updatePerfumeList(
  listId: number,
  input: ListInput,
): Promise<PerfumeListActionResult> {
  try {
    const user = await getAuthenticatedAppUser();
    const data = normalizeListInput(input);
    const current = await prisma.perfumeList.findFirst({
      where: { id: listId, userId: user.id },
      select: { id: true },
    });

    if (!current) {
      throw new Error("Lista non trovata.");
    }

    const slug = await getUniqueListSlug(user.id, data.name, listId);
    await prisma.perfumeList.update({
      where: { id: listId },
      data: {
        ...data,
        slug,
      },
    });

    revalidateListSurfaces();
    return { ok: true, listId };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Impossibile aggiornare la lista." };
  }
}

export async function deletePerfumeList(listId: number): Promise<PerfumeListActionResult> {
  try {
    const user = await getAuthenticatedAppUser();
    await prisma.perfumeList.deleteMany({
      where: {
        id: listId,
        userId: user.id,
      },
    });

    revalidateListSurfaces();
    return { ok: true };
  } catch {
    return { ok: false, error: "Impossibile eliminare la lista." };
  }
}

export async function togglePerfumeListVisibility(
  listId: number,
  visibility: PerfumeListVisibilityValue,
): Promise<PerfumeListActionResult> {
  try {
    const user = await getAuthenticatedAppUser();
    await prisma.perfumeList.updateMany({
      where: {
        id: listId,
        userId: user.id,
      },
      data: {
        visibility: visibility === "PUBLIC" ? "PUBLIC" : "PRIVATE",
      },
    });

    revalidateListSurfaces();
    return { ok: true, listId };
  } catch {
    return { ok: false, error: "Impossibile modificare la visibilita." };
  }
}

export async function addPerfumeToLists(
  perfumeId: number,
  listIds: number[],
): Promise<PerfumeListActionResult> {
  try {
    const user = await getAuthenticatedAppUser();
    const uniqueListIds = Array.from(new Set(listIds.filter((id) => Number.isInteger(id) && id > 0)));

    if (uniqueListIds.length === 0) {
      return { ok: true };
    }

    const lists = await prisma.perfumeList.findMany({
      where: {
        userId: user.id,
        id: { in: uniqueListIds },
      },
      select: { id: true },
    });

    await prisma.perfumeListItem.createMany({
      data: lists.map((list) => ({
        listId: list.id,
        perfumeId,
      })),
      skipDuplicates: true,
    });

    revalidateListSurfaces();
    return { ok: true };
  } catch {
    return { ok: false, error: "Impossibile aggiungere il profumo alla lista." };
  }
}

export async function removePerfumeFromList(
  listId: number,
  perfumeId: number,
): Promise<PerfumeListActionResult> {
  try {
    const user = await getAuthenticatedAppUser();
    const list = await prisma.perfumeList.findFirst({
      where: { id: listId, userId: user.id },
      select: { id: true },
    });

    if (!list) {
      throw new Error("Lista non trovata.");
    }

    await prisma.perfumeListItem.deleteMany({
      where: { listId, perfumeId },
    });

    revalidateListSurfaces();
    return { ok: true };
  } catch {
    return { ok: false, error: "Impossibile rimuovere il profumo dalla lista." };
  }
}

export async function createListAndAddPerfume(
  perfumeId: number,
  input: ListInput,
): Promise<PerfumeListActionResult> {
  const created = await createPerfumeList(input);
  if (!created.ok || !created.listId) {
    return created;
  }

  return addPerfumeToLists(perfumeId, [created.listId]);
}
