"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { type UpdatePasswordState, updatePassword } from "@/app/reset-password/actions";
import { buttonStyles } from "@/components/ui/Button";
import { Link } from "@/lib/navigation";

const initialState: UpdatePasswordState = {};

export function UpdatePasswordForm() {
  const t = useTranslations("auth.resetPassword.page.updateForm");
  const locale = useLocale();
  const [state, formAction, isPending] = useActionState(updatePassword, initialState);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <input type="hidden" name="locale" value={locale} />

      <div className="space-y-1.5">
        <label htmlFor="new-password" className="text-sm font-medium text-[#3a2e24]">
          {t("password")}
        </label>
        <input
          id="new-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          placeholder={t("passwordPlaceholder")}
          className="h-11 w-full rounded-xl border border-[#ddcfbe] bg-white px-3 text-sm outline-none transition focus:border-[#bda88f]"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="confirm-password" className="text-sm font-medium text-[#3a2e24]">
          {t("confirmPassword")}
        </label>
        <input
          id="confirm-password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          placeholder={t("confirmPasswordPlaceholder")}
          className="h-11 w-full rounded-xl border border-[#ddcfbe] bg-white px-3 text-sm outline-none transition focus:border-[#bda88f]"
        />
      </div>

      {state?.error ? (
        <div className="rounded-xl border border-[#dfcab0] bg-[#faf4eb] px-3 py-2 text-sm text-[#6d5644]">
          {state.error}
        </div>
      ) : null}

      {state?.message ? (
        <div className="space-y-3 rounded-xl border border-[#d7dbc6] bg-[#f7fbef] px-3 py-3 text-sm text-[#4f6446]">
          <p>{state.message}</p>
          <Link href="/profile" className={buttonStyles({ variant: "secondary", className: "w-full justify-center" })}>
            {t("continue")}
          </Link>
        </div>
      ) : null}

      <button type="submit" disabled={isPending} className={buttonStyles({ className: "mt-2 w-full" })}>
        {isPending ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
