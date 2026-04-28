"use server";

import { revalidatePath } from "next/cache";

import { ensureAppUser } from "@/lib/perfume-lists";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export type CommunityActionState = {
  ok?: boolean;
  error?: string;
  message?: string;
};

async function getAuthenticatedAppUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Devi accedere per contribuire.");
  }

  return ensureAppUser(user);
}

function readScore(formData: FormData, name: string) {
  const raw = Number.parseInt(String(formData.get(name) ?? ""), 10);
  if (!Number.isFinite(raw) || raw < 1 || raw > 10) {
    throw new Error("I voti devono essere compresi tra 1 e 10.");
  }
  return raw;
}

export async function savePerfumeReview(
  _previousState: CommunityActionState,
  formData: FormData,
): Promise<CommunityActionState> {
  try {
    if (!prisma.perfumeReview) {
      return { error: "La sezione community si sta aggiornando. Riprova tra poco." };
    }

    const user = await getAuthenticatedAppUser();
    const perfumeId = Number.parseInt(String(formData.get("perfumeId") ?? ""), 10);
    const detailPath = String(formData.get("detailPath") ?? "/");
    const text = String(formData.get("text") ?? "").trim();

    if (!Number.isInteger(perfumeId) || perfumeId <= 0) {
      return { error: "Profumo non valido." };
    }

    if (text.length > 500) {
      return { error: "La recensione non puo superare 500 caratteri." };
    }

    await prisma.perfumeReview.upsert({
      where: {
        userId_perfumeId: {
          userId: user.id,
          perfumeId,
        },
      },
      create: {
        userId: user.id,
        perfumeId,
        longevityScore: readScore(formData, "longevityScore"),
        sillageScore: readScore(formData, "sillageScore"),
        versatilityScore: readScore(formData, "versatilityScore"),
        text: text || null,
      },
      update: {
        longevityScore: readScore(formData, "longevityScore"),
        sillageScore: readScore(formData, "sillageScore"),
        versatilityScore: readScore(formData, "versatilityScore"),
        text: text || null,
      },
    });

    revalidatePath(detailPath);
    return { ok: true, message: "Recensione salvata." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Non sono riuscito a salvare la recensione." };
  }
}

export async function savePerfumePurchasePrice(
  _previousState: CommunityActionState,
  formData: FormData,
): Promise<CommunityActionState> {
  try {
    if (!prisma.perfumePurchasePrice) {
      return { error: "La sezione community si sta aggiornando. Riprova tra poco." };
    }

    const user = await getAuthenticatedAppUser();
    const perfumeId = Number.parseInt(String(formData.get("perfumeId") ?? ""), 10);
    const priceAmount = Number.parseFloat(String(formData.get("priceAmount") ?? "").replace(",", "."));
    const currency = String(formData.get("currency") ?? "EUR").trim().toUpperCase().slice(0, 3) || "EUR";
    const countryCode = String(formData.get("countryCode") ?? "").trim().toUpperCase().slice(0, 2) || null;
    const storeName = String(formData.get("storeName") ?? "").trim().slice(0, 80) || null;
    const purchaseDateValue = String(formData.get("purchaseDate") ?? "").trim();
    const detailPath = String(formData.get("detailPath") ?? "/");

    if (!Number.isInteger(perfumeId) || perfumeId <= 0) {
      return { error: "Profumo non valido." };
    }

    if (!Number.isFinite(priceAmount) || priceAmount <= 0 || priceAmount > 10000) {
      return { error: "Inserisci un prezzo valido." };
    }

    await prisma.perfumePurchasePrice.create({
      data: {
        userId: user.id,
        perfumeId,
        priceAmount,
        currency,
        countryCode: countryCode || user.countryCode,
        storeName,
        purchaseDate: purchaseDateValue ? new Date(purchaseDateValue) : null,
      },
    });

    revalidatePath(detailPath);
    return { ok: true, message: "Prezzo aggiunto." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Non sono riuscito a salvare il prezzo." };
  }
}
