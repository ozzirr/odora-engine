"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { sanitizeAuthNextPath } from "@/lib/auth-navigation";
import { defaultLocale, getLocalizedPathname, hasLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

export type LoginFormState = {
  error?: string;
};

export async function loginWithPassword(
  _previousState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const localeValue = formData.get("locale");
  const locale = typeof localeValue === "string" && hasLocale(localeValue) ? localeValue : defaultLocale;
  const t = await getTranslations({ locale, namespace: "auth.actions.login" });
  const emailValue = formData.get("email");
  const passwordValue = formData.get("password");
  const nextPath = sanitizeAuthNextPath(
    typeof formData.get("next") === "string" ? (formData.get("next") as string) : null,
    getLocalizedPathname(locale, "/perfumes"),
  );

  const email = typeof emailValue === "string" ? emailValue.trim().toLowerCase() : "";
  const password = typeof passwordValue === "string" ? passwordValue : "";

  if (!email || !password) {
    return { error: t("missingCredentials") };
  }

  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return { error: t("authUnavailable") };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: t("invalidCredentials") };
  }

  revalidatePath("/", "layout");
  revalidatePath(nextPath);
  redirect(nextPath);
}
