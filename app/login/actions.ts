"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type LoginFormState = {
  error?: string;
};

function sanitizeNextPath(value: FormDataEntryValue | null | undefined) {
  if (typeof value !== "string") {
    return "/perfumes";
  }

  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return "/perfumes";
  }

  if (trimmed === "/login" || trimmed === "/signup") {
    return "/perfumes";
  }

  return trimmed;
}

export async function loginWithPassword(
  _previousState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const emailValue = formData.get("email");
  const passwordValue = formData.get("password");
  const nextPath = sanitizeNextPath(formData.get("next"));

  const email = typeof emailValue === "string" ? emailValue.trim().toLowerCase() : "";
  const password = typeof passwordValue === "string" ? passwordValue : "";

  if (!email || !password) {
    return { error: "Inserisci email e password." };
  }

  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return { error: "Configurazione autenticazione non disponibile. Riprova tra poco." };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "Credenziali non valide. Controlla email e password." };
  }

  revalidatePath("/", "layout");
  revalidatePath(nextPath);
  redirect(nextPath);
}
