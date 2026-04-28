"use client";

import { useActionState } from "react";
import { useLocale } from "next-intl";

import { loginAsDevUser, type LoginFormState } from "@/app/login/actions";

type DevLoginButtonProps = {
  nextPath: string;
};

const initialState: LoginFormState = {};

export function DevLoginButton({ nextPath }: DevLoginButtonProps) {
  const locale = useLocale();
  const [state, formAction, isPending] = useActionState(loginAsDevUser, initialState);

  return (
    <form action={formAction} className="mt-3">
      <input type="hidden" name="next" value={nextPath} />
      <input type="hidden" name="locale" value={locale} />
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl border border-dashed border-[#b89870] bg-[#fef6e8] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#6d5028] hover:bg-[#fbecd0] disabled:opacity-60"
      >
        {isPending ? "Signing in..." : "Dev login (local only)"}
      </button>
      {state?.error ? (
        <p className="mt-2 text-xs text-[#a04040]">{state.error}</p>
      ) : null}
    </form>
  );
}
