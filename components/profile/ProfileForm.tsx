"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { updateProfile, type ProfileFormState } from "@/app/profile/actions";
import { buttonStyles } from "@/components/ui/Button";

type ProfileFormProps = {
  email: string;
  initialName: string;
  initialCountryCode?: string | null;
  initialBirthDate?: string | null;
};

const initialState: ProfileFormState = {};

export function ProfileForm({ email, initialName, initialCountryCode, initialBirthDate }: ProfileFormProps) {
  const t = useTranslations("profile.form");
  const locale = useLocale();
  const [state, formAction, isPending] = useActionState(updateProfile, initialState);

  return (
    <form action={formAction} className="space-y-4">
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
          defaultValue={initialName}
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
          value={email}
          readOnly
          disabled
          className="h-11 w-full rounded-xl border border-[#e4d8ca] bg-[#f6f0e8] px-3 text-sm text-[#796857]"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="countryCode" className="text-sm font-medium text-[#3a2e24]">
            {t("countryCode")}
          </label>
          <input
            id="countryCode"
            name="countryCode"
            type="text"
            maxLength={2}
            defaultValue={initialCountryCode ?? ""}
            placeholder={t("countryCodePlaceholder")}
            className="h-11 w-full rounded-xl border border-[#ddcfbe] bg-white px-3 text-sm uppercase outline-none transition focus:border-[#bda88f]"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="birthDate" className="text-sm font-medium text-[#3a2e24]">
            {t("birthDate")}
          </label>
          <input
            id="birthDate"
            name="birthDate"
            type="date"
            defaultValue={initialBirthDate ?? ""}
            className="h-11 w-full rounded-xl border border-[#ddcfbe] bg-white px-3 text-sm outline-none transition focus:border-[#bda88f]"
          />
        </div>
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

      <button type="submit" disabled={isPending} className={buttonStyles({ className: "w-full sm:w-auto" })}>
        {isPending ? t("saving") : t("submit")}
      </button>
    </form>
  );
}
