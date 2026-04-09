"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";

import {
  requestPasswordReset,
  type PasswordResetRequestState,
} from "@/app/reset-password/actions";
import { buttonStyles } from "@/components/ui/Button";

const initialState: PasswordResetRequestState = {};

export function RequestPasswordResetForm() {
  const t = useTranslations("auth.resetPassword.page.requestForm");
  const locale = useLocale();
  const [state, formAction, isPending] = useActionState(requestPasswordReset, initialState);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <input type="hidden" name="locale" value={locale} />

      <div className="space-y-1.5">
        <label htmlFor="reset-email" className="text-sm font-medium text-[#3a2e24]">
          {t("email")}
        </label>
        <input
          id="reset-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder={t("emailPlaceholder")}
          className="h-11 w-full rounded-xl border border-[#ddcfbe] bg-white px-3 text-sm outline-none transition focus:border-[#bda88f]"
        />
      </div>

      {state?.error ? (
        <div className="rounded-xl border border-[#dfcab0] bg-[#faf4eb] px-3 py-2 text-sm text-[#6d5644]">
          {state.error}
        </div>
      ) : null}

      {state?.message ? (
        <div className="rounded-xl border border-[#d7dbc6] bg-[#f7fbef] px-3 py-2 text-sm text-[#4f6446]">
          {state.message}
        </div>
      ) : null}

      <button type="submit" disabled={isPending} className={buttonStyles({ className: "mt-2 w-full" })}>
        {isPending ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
