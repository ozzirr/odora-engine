"use client";

import { useActionState } from "react";

import { loginWithPassword, type LoginFormState } from "@/app/login/actions";
import { buttonStyles } from "@/components/ui/Button";

type LoginFormProps = {
  nextPath?: string;
  initialError?: string;
};

const initialState: LoginFormState = {};

export function LoginForm({ nextPath = "/perfumes", initialError }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(loginWithPassword, {
    ...initialState,
    ...(initialError ? { error: initialError } : {}),
  });

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <input type="hidden" name="next" value={nextPath} />

      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium text-[#3a2e24]">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="nome@esempio.com"
          className="h-11 w-full rounded-xl border border-[#ddcfbe] bg-white px-3 text-sm outline-none transition focus:border-[#bda88f]"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium text-[#3a2e24]">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="Inserisci la password"
          className="h-11 w-full rounded-xl border border-[#ddcfbe] bg-white px-3 text-sm outline-none transition focus:border-[#bda88f]"
        />
      </div>

      {state?.error ? (
        <div className="rounded-xl border border-[#dfcab0] bg-[#faf4eb] px-3 py-2 text-sm text-[#6d5644]">
          {state.error}
        </div>
      ) : null}

      <button type="submit" disabled={isPending} className={buttonStyles({ className: "mt-2 w-full" })}>
        {isPending ? "Accesso in corso..." : "Accedi"}
      </button>
    </form>
  );
}
