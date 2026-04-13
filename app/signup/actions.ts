"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { sanitizeAuthNextPath } from "@/lib/auth-navigation";
import { getBaseSiteUrl } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { defaultLocale, getLocalizedPathname, hasLocale } from "@/lib/i18n";
import { buildRateLimitIdentity, getClientIp } from "@/lib/security/request-context";
import { consumeRateLimit } from "@/lib/security/rate-limit";

export type SignupFormState = {
  error?: string;
  message?: string;
};

export async function signupWithPassword(
  _previousState: SignupFormState,
  formData: FormData,
): Promise<SignupFormState> {
  const localeValue = formData.get("locale");
  const locale = typeof localeValue === "string" && hasLocale(localeValue) ? localeValue : defaultLocale;
  const t = await getTranslations({ locale, namespace: "auth.actions.signup" });
  const nameValue = formData.get("name");
  const emailValue = formData.get("email");
  const passwordValue = formData.get("password");
  const confirmPasswordValue = formData.get("confirmPassword");
  const nextPath = sanitizeAuthNextPath(
    typeof formData.get("next") === "string" ? (formData.get("next") as string) : null,
    getLocalizedPathname(locale, "/perfumes"),
  );

  const name = typeof nameValue === "string" ? nameValue.trim() : "";
  const email = typeof emailValue === "string" ? emailValue.trim().toLowerCase() : "";
  const password = typeof passwordValue === "string" ? passwordValue : "";
  const confirmPassword = typeof confirmPasswordValue === "string" ? confirmPasswordValue : "";

  if (!email || !password) {
    return { error: t("missingCredentials") };
  }

  if (password.length < 8) {
    return { error: t("passwordTooShort") };
  }

  if (password !== confirmPassword) {
    return { error: t("passwordMismatch") };
  }

  const requestHeaders = await headers();
  const clientIp = getClientIp(requestHeaders);
  const rateLimitChecks = [
    consumeRateLimit(buildRateLimitIdentity(["signup", clientIp]), {
      limit: 5,
      windowMs: 30 * 60 * 1000,
      blockMs: 60 * 60 * 1000,
    }),
    consumeRateLimit(buildRateLimitIdentity(["signup", clientIp, email]), {
      limit: 3,
      windowMs: 30 * 60 * 1000,
      blockMs: 60 * 60 * 1000,
    }),
  ];

  if (rateLimitChecks.some((result) => !result.allowed)) {
    return { error: t("tooManyAttempts") };
  }

  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return { error: t("authUnavailable") };
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
    return { error: t("signupFailed") };
  }

  if (data.session) {
    revalidatePath("/", "layout");
    revalidatePath(nextPath);
    redirect(nextPath);
  }

  return {
    message: t("success"),
  };
}
