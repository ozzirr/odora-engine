"use server";

import { revalidatePath } from "next/cache";

import { ensureAppUser } from "@/lib/perfume-lists";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export type PriceAlertActionState = {
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
    throw new Error("Devi accedere per attivare gli avvisi prezzo.");
  }

  return ensureAppUser(user);
}

export async function savePerfumePriceAlert(
  _previousState: PriceAlertActionState,
  formData: FormData,
): Promise<PriceAlertActionState> {
  try {
    if (!prisma.perfumePriceAlert) {
      return { error: "Gli avvisi prezzo si stanno aggiornando. Riprova tra poco." };
    }

    const user = await getAuthenticatedAppUser();
    const perfumeId = Number.parseInt(String(formData.get("perfumeId") ?? ""), 10);
    const detailPath = String(formData.get("detailPath") ?? "/");

    if (!Number.isInteger(perfumeId) || perfumeId <= 0) {
      return { error: "Profumo non valido." };
    }

    await prisma.perfumePriceAlert.upsert({
      where: {
        userId_perfumeId: {
          userId: user.id,
          perfumeId,
        },
      },
      create: {
        userId: user.id,
        perfumeId,
        active: true,
      },
      update: {
        active: true,
      },
    });

    revalidatePath(detailPath);
    return { ok: true, message: "Avviso prezzo attivato." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Non sono riuscito ad attivare l'avviso prezzo." };
  }
}
