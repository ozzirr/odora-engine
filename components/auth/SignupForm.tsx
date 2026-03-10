"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { signupWithPassword, type SignupFormState } from "@/app/signup/actions";
import { buttonStyles } from "@/components/ui/Button";

type SignupFormProps = {
  nextPath?: string;
  initialError?: string;
};

const initialState: SignupFormState = {};

export function SignupForm({ nextPath = "/perfumes", initialError }: SignupFormProps) {
  const t = useTranslations("auth.signup.page.form");
  const locale = useLocale();
  const [state, formAction, isPending] = useActionState(signupWithPassword, {
    ...initialState,
    ...(initialError ? { error: initialError } : {}),
  });

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <input type="hidden" name="next" value={nextPath} />
      <input type="hidden" name="locale" value={locale} />

      <div className="space-y-1.5">
        <label htmlFor="name" className="text-sm font-medium text-[#3a2e24]">
          {t("name")}
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          placeholder={t("namePlaceholder")}
          className="h-11 w-full rounded-xl border border-[#ddcfbe] bg-white px-3 text-sm outline-none transition focus:border-[#bda88f]"
        />
      </div>

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
          autoComplete="new-password"
          required
          placeholder={t("passwordPlaceholder")}
          className="h-11 w-full rounded-xl border border-[#ddcfbe] bg-white px-3 text-sm outline-none transition focus:border-[#bda88f]"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="confirmPassword" className="text-sm font-medium text-[#3a2e24]">
          {t("confirmPassword")}
        </label>
        <input
          id="confirmPassword"
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
        <div className="rounded-xl border border-[#d1dbc3] bg-[#f3f8eb] px-3 py-2 text-sm text-[#4d6340]">
          {state.message}
        </div>
      ) : null}

      <button type="submit" disabled={isPending} className={buttonStyles({ className: "mt-2 w-full" })}>
        {isPending ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
