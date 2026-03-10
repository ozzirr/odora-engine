"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { loginWithPassword, type LoginFormState } from "@/app/login/actions";
import { buttonStyles } from "@/components/ui/Button";

type LoginFormProps = {
  nextPath?: string;
  initialError?: string;
};

const initialState: LoginFormState = {};

export function LoginForm({ nextPath = "/perfumes", initialError }: LoginFormProps) {
  const t = useTranslations("auth.login.page.form");
  const locale = useLocale();
  const [state, formAction, isPending] = useActionState(loginWithPassword, {
    ...initialState,
    ...(initialError ? { error: initialError } : {}),
  });

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <input type="hidden" name="next" value={nextPath} />
      <input type="hidden" name="locale" value={locale} />

      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium text-[#3a2e24]">
          {t("email")}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder={t("emailPlaceholder")}
          className="h-11 w-full rounded-xl border border-[#ddcfbe] bg-white px-3 text-sm outline-none transition focus:border-[#bda88f]"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium text-[#3a2e24]">
          {t("password")}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder={t("passwordPlaceholder")}
          className="h-11 w-full rounded-xl border border-[#ddcfbe] bg-white px-3 text-sm outline-none transition focus:border-[#bda88f]"
        />
      </div>

      {state?.error ? (
        <div className="rounded-xl border border-[#dfcab0] bg-[#faf4eb] px-3 py-2 text-sm text-[#6d5644]">
          {state.error}
        </div>
      ) : null}

      <button type="submit" disabled={isPending} className={buttonStyles({ className: "mt-2 w-full" })}>
        {isPending ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
