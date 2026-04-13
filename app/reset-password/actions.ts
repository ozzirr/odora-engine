"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";

import { defaultLocale, getLocalizedPathname, hasLocale } from "@/lib/i18n";
import { buildRateLimitIdentity, getClientIp } from "@/lib/security/request-context";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { getBaseSiteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";

export type PasswordResetRequestState = {
  error?: string;
  message?: string;
};

export type UpdatePasswordState = {
  error?: string;
  message?: string;
};

export async function requestPasswordReset(
  _previousState: PasswordResetRequestState,
  formData: FormData,
): Promise<PasswordResetRequestState> {
  const localeValue = formData.get("locale");
  const locale = typeof localeValue === "string" && hasLocale(localeValue) ? localeValue : defaultLocale;
  const t = await getTranslations({ locale, namespace: "auth.actions.resetPasswordRequest" });
  const emailValue = formData.get("email");
  const email = typeof emailValue === "string" ? emailValue.trim().toLowerCase() : "";

  if (!email) {
    return { error: t("missingEmail") };
  }

  const requestHeaders = await headers();
  const clientIp = getClientIp(requestHeaders);
  const rateLimitChecks = [
    consumeRateLimit(buildRateLimitIdentity(["reset-password", clientIp]), {
      limit: 5,
      windowMs: 15 * 60 * 1000,
      blockMs: 30 * 60 * 1000,
    }),
    consumeRateLimit(buildRateLimitIdentity(["reset-password", clientIp, email]), {
      limit: 2,
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

  const nextPath = `${getLocalizedPathname(locale, "/reset-password")}?mode=update`;
  const callbackUrl = new URL("/auth/callback", getBaseSiteUrl());
  callbackUrl.searchParams.set("next", nextPath);

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: callbackUrl.toString(),
  });

  if (error) {
    return { error: t("requestFailed") };
  }

  return { message: t("success") };
}

export async function updatePassword(
  _previousState: UpdatePasswordState,
  formData: FormData,
): Promise<UpdatePasswordState> {
  const localeValue = formData.get("locale");
  const locale = typeof localeValue === "string" && hasLocale(localeValue) ? localeValue : defaultLocale;
  const t = await getTranslations({ locale, namespace: "auth.actions.updatePassword" });
  const passwordValue = formData.get("password");
  const confirmPasswordValue = formData.get("confirmPassword");
  const password = typeof passwordValue === "string" ? passwordValue : "";
  const confirmPassword = typeof confirmPasswordValue === "string" ? confirmPasswordValue : "";

  if (!password || !confirmPassword) {
    return { error: t("missingCredentials") };
  }

  if (password.length < 8) {
    return { error: t("passwordTooShort") };
  }

  if (password !== confirmPassword) {
    return { error: t("passwordMismatch") };
  }

  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return { error: t("authUnavailable") };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: t("invalidSession") };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: t("updateFailed") };
  }

  revalidatePath("/", "layout");
  revalidatePath(getLocalizedPathname(locale, "/profile"));

  return { message: t("success") };
}
