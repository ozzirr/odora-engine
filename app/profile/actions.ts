"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";

import { defaultLocale, getLocalizedPathname, hasLocale } from "@/lib/i18n";
import { ensureAppUser } from "@/lib/perfume-lists";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export type ProfileFormState = {
  error?: string;
  message?: string;
};

export async function updateProfile(
  _previousState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const localeValue = formData.get("locale");
  const locale = typeof localeValue === "string" && hasLocale(localeValue) ? localeValue : defaultLocale;
  const t = await getTranslations({ locale, namespace: "profile.actions" });
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

  const nameValue = formData.get("name");
  const name = typeof nameValue === "string" ? nameValue.trim() : "";
  const countryCodeValue = formData.get("countryCode");
  const countryCode = typeof countryCodeValue === "string" ? countryCodeValue.trim().toUpperCase() : "";
  const birthDateValue = formData.get("birthDate");
  const birthDateRaw = typeof birthDateValue === "string" ? birthDateValue.trim() : "";

  if (name.length > 80) {
    return { error: t("nameTooLong") };
  }

  if (countryCode && !/^[A-Z]{2}$/.test(countryCode)) {
    return { error: t("countryInvalid") };
  }

  const birthDate = birthDateRaw ? new Date(birthDateRaw) : null;
  if (birthDateRaw && Number.isNaN(birthDate?.getTime())) {
    return { error: t("birthDateInvalid") };
  }

  const { error } = await supabase.auth.updateUser({
    data: {
      name,
    },
  });

  if (error) {
    return { error: t("updateFailed") };
  }

  const appUser = await ensureAppUser(user);
  await prisma.user.update({
    where: { id: appUser.id },
    data: {
      name,
      countryCode: countryCode || null,
      birthDate,
    },
  });

  revalidatePath("/", "layout");
  revalidatePath("/profile");

  return { message: t("updated") };
}

export async function signOut(formData: FormData) {
  const localeValue = formData.get("locale");
  const locale = typeof localeValue === "string" && hasLocale(localeValue) ? localeValue : defaultLocale;
  const supabase = await createClient();
  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect(getLocalizedPathname(locale, "/"));
}
