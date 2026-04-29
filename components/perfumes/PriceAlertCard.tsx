"use client";

import { useActionState } from "react";

import { savePerfumePriceAlert, type PriceAlertActionState } from "@/app/perfume-price-alert/actions";

type PriceAlertCardProps = {
  perfumeId: number;
  detailPath: string;
  isAuthenticated: boolean;
  loginHref: string;
  isActive?: boolean;
};

const initialState: PriceAlertActionState = {};

export function PriceAlertCard({
  perfumeId,
  detailPath,
  isAuthenticated,
  loginHref,
  isActive = false,
}: PriceAlertCardProps) {
  const [state, action, pending] = useActionState(savePerfumePriceAlert, initialState);
  const active = isActive || state.ok;

  return (
    <section className="rounded-[1.45rem] border border-[#eadfce] bg-[linear-gradient(135deg,#fffdf9,#fff7eb)] p-5 shadow-[0_18px_42px_-36px_rgba(53,39,27,0.28)]">
      <h2 className="font-display text-2xl text-[#21180f]">Attiva avviso prezzo</h2>
      <p className="mt-2 text-sm leading-6 text-[#685747]">
        Ti avviseremo quando il prezzo diminuisce su Amazon.
      </p>

      {!isAuthenticated ? (
        <a
          href={loginHref}
          className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl border border-[#ddcfbc] bg-white text-sm font-semibold text-[#1e4b3b] shadow-[0_16px_34px_-32px_rgba(53,39,27,0.28)]"
        >
          Accedi per attivare
        </a>
      ) : (
        <form action={action}>
          <input type="hidden" name="perfumeId" value={perfumeId} />
          <input type="hidden" name="detailPath" value={detailPath} />
          <button
            type="submit"
            disabled={pending || active}
            className="mt-4 h-11 w-full rounded-xl border border-[#ddcfbc] bg-white text-sm font-semibold text-[#1e4b3b] shadow-[0_16px_34px_-32px_rgba(53,39,27,0.28)] disabled:cursor-default disabled:bg-[#f5efe6] disabled:text-[#7b6854]"
          >
            {pending ? "Attivazione..." : active ? "Avviso attivo" : "Attiva avviso"}
          </button>
        </form>
      )}

      {state.error ? <p className="mt-3 text-sm text-[#7c3f35]">{state.error}</p> : null}
      {state.message ? <p className="mt-3 text-sm text-[#4d6340]">{state.message}</p> : null}
    </section>
  );
}
