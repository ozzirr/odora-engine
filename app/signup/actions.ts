"use server";

import { redirect } from "next/navigation";

import { getBaseSiteUrl } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type SignupFormState = {
  error?: string;
  message?: string;
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

export async function signupWithPassword(
  _previousState: SignupFormState,
  formData: FormData,
): Promise<SignupFormState> {
  const nameValue = formData.get("name");
  const emailValue = formData.get("email");
  const passwordValue = formData.get("password");
  const confirmPasswordValue = formData.get("confirmPassword");
  const nextPath = sanitizeNextPath(formData.get("next"));

  const name = typeof nameValue === "string" ? nameValue.trim() : "";
  const email = typeof emailValue === "string" ? emailValue.trim().toLowerCase() : "";
  const password = typeof passwordValue === "string" ? passwordValue : "";
  const confirmPassword = typeof confirmPasswordValue === "string" ? confirmPasswordValue : "";

  if (!email || !password) {
    return { error: "Inserisci email e password." };
  }

  if (password.length < 8) {
    return { error: "La password deve contenere almeno 8 caratteri." };
  }

  if (password !== confirmPassword) {
    return { error: "Le password non coincidono." };
  }

  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return { error: "Configurazione autenticazione non disponibile. Riprova tra poco." };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
      emailRedirectTo: `${getBaseSiteUrl()}/auth/callback?next=${encodeURIComponent(nextPath)}`,
    },
  });

  if (error) {
    return { error: "Registrazione non completata. Verifica i dati e riprova." };
  }

  if (data.session) {
    redirect(nextPath);
  }

  return {
    message:
      "Account creato. Controlla la tua email per confermare la registrazione e completare l’accesso.",
  };
}
