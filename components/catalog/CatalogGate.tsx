import Link from "next/link";

import { buttonStyles } from "@/components/ui/Button";

type CatalogGateProps = {
  previewLimit: number;
};

export function CatalogGate({ previewLimit }: CatalogGateProps) {
  return (
    <div className="rounded-2xl border border-[#d8c8b5] bg-[#fbf5ec] px-6 py-8 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a7763]">Continue Discovery</p>
      <h3 className="mt-2 font-display text-3xl text-[#201711]">Accedi per vedere tutto il catalogo</h3>
      <p className="mx-auto mt-3 max-w-2xl text-sm text-[#675545]">
        Hai visto i primi {previewLimit} profumi. Accedi o crea un account per continuare a esplorare tutto il catalogo.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link href="/login" className={buttonStyles()}>
          Accedi
        </Link>
        <Link href="/signup" className={buttonStyles({ variant: "secondary" })}>
          Crea account
        </Link>
      </div>
    </div>
  );
}
