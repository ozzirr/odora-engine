"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type ProfileFormState = {
  error?: string;
  message?: string;
};

export async function updateProfile(
  _previousState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return { error: "Configurazione autenticazione non disponibile. Riprova tra poco." };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Sessione non valida. Effettua di nuovo l'accesso." };
  }

  const nameValue = formData.get("name");
  const name = typeof nameValue === "string" ? nameValue.trim() : "";

  if (name.length > 80) {
    return { error: "Il nome non puo superare 80 caratteri." };
  }

  const { error } = await supabase.auth.updateUser({
    data: {
      name,
    },
  });

  if (error) {
    return { error: "Non sono riuscito ad aggiornare il profilo. Riprova." };
  }

  revalidatePath("/", "layout");
  revalidatePath("/profile");

  return { message: "Profilo aggiornato." };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/");
}
