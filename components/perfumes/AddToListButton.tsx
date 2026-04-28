"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

import {
  addPerfumeToLists,
  createListAndAddPerfume,
} from "@/app/perfume-lists/actions";
import { buttonStyles } from "@/components/ui/Button";
import type { UserPerfumeListForPerfume } from "@/lib/perfume-lists";

type AddToListButtonProps = {
  perfumeId: number;
  isAuthenticated: boolean;
  lists: UserPerfumeListForPerfume[];
  loginNextPath: string;
};

export function AddToListButton({ perfumeId, isAuthenticated, lists, loginNextPath }: AddToListButtonProps) {
  const locale = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isAuthenticated) {
    return (
      <div className="rounded-[1.45rem] border border-[#ddcfbc] bg-[#fffdf9] p-4">
        <p className="font-display text-2xl text-[#21180f]">Aggiungi a lista</p>
        <p className="mt-1 text-sm leading-6 text-[#685747]">
          Accedi o registrati per salvare questo profumo nelle tue liste.
        </p>
        <a
          href={`/${locale === "it" ? "it/accedi" : "en/login"}?next=${encodeURIComponent(loginNextPath)}`}
          className={buttonStyles({ className: "mt-4 w-full sm:w-auto" })}
        >
          Accedi
        </a>
      </div>
    );
  }

  const toggleSelected = (listId: number) => {
    setSelected((current) =>
      current.includes(listId) ? current.filter((id) => id !== listId) : [...current, listId],
    );
  };

  const saveToLists = () => {
    startTransition(async () => {
      const result = await addPerfumeToLists(perfumeId, selected);
      if (result.ok) {
        setError(null);
        setMessage("Profumo aggiunto alle liste selezionate.");
        setOpen(false);
        router.refresh();
        return;
      }
      setMessage(null);
      setError(result.error ?? "Operazione non riuscita.");
    });
  };

  const createAndSave = (formData: FormData) => {
    startTransition(async () => {
      const result = await createListAndAddPerfume(perfumeId, {
        name: String(formData.get("name") ?? ""),
        description: String(formData.get("description") ?? ""),
        visibility: formData.get("visibility") === "PUBLIC" ? "PUBLIC" : "PRIVATE",
      });
      if (result.ok) {
        setError(null);
        setMessage("Lista creata e profumo aggiunto.");
        setCreateOpen(false);
        setOpen(false);
        router.refresh();
        return;
      }
      setMessage(null);
      setError(result.error ?? "Operazione non riuscita.");
    });
  };

  return (
    <div className="rounded-[1.45rem] border border-[#ddcfbc] bg-[#fffdf9] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-2xl text-[#21180f]">Aggiungi a lista</p>
          <p className="mt-1 text-sm text-[#685747]">Salva questo profumo in una o piu selezioni personali.</p>
        </div>
        <button type="button" className={buttonStyles({ className: "w-full sm:w-auto" })} onClick={() => setOpen(true)}>
          Aggiungi a lista
        </button>
      </div>

      {message ? <p className="mt-3 text-sm text-[#4d6340]">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-[#7c3f35]">{error}</p> : null}

      {open ? (
        <div className="fixed inset-0 z-[120] flex items-end justify-center bg-[rgba(26,20,15,0.32)] px-4 py-5 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-lg rounded-[1.8rem] border border-[#ddcfbe] bg-[#fffdf9] p-5 shadow-[0_34px_90px_-42px_rgba(36,25,16,0.65)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8b7762]">Liste profumi</p>
                <h3 className="mt-1 font-display text-3xl text-[#21180f]">Aggiungi a lista</h3>
              </div>
              <button type="button" className="rounded-full px-3 py-1 text-sm text-[#6b5948]" onClick={() => setOpen(false)}>
                Chiudi
              </button>
            </div>

            <div className="mt-5 space-y-2">
              {lists.length === 0 ? (
                <p className="rounded-xl border border-dashed border-[#d8c9b6] bg-[#fbf7f0] p-4 text-sm text-[#685747]">
                  Nessuna lista ancora. Crea la tua prima selezione qui sotto.
                </p>
              ) : (
                lists.map((list) => (
                  <label key={list.id} className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-[#e2d5c5] bg-white px-4 py-3">
                    <span>
                      <span className="block font-medium text-[#21180f]">{list.name}</span>
                      <span className="text-xs text-[#7b6854]">
                        {list.containsPerfume ? "Gia presente" : `${list.itemCount} profumi`}
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      disabled={list.containsPerfume}
                      checked={selected.includes(list.id) || list.containsPerfume}
                      onChange={() => toggleSelected(list.id)}
                    />
                  </label>
                ))
              )}
            </div>

            {createOpen ? (
              <form action={createAndSave} className="mt-5 space-y-3 rounded-[1.2rem] border border-[#e2d5c5] bg-[#fbf7f0] p-4">
                <input
                  name="name"
                  placeholder="Nome lista"
                  required
                  className="h-11 w-full rounded-xl border border-[#ddcfbe] bg-white px-3 text-sm outline-none"
                />
                <textarea
                  name="description"
                  placeholder="Descrizione"
                  rows={2}
                  className="w-full rounded-xl border border-[#ddcfbe] bg-white px-3 py-2 text-sm outline-none"
                />
                <select name="visibility" className="h-11 w-full rounded-xl border border-[#ddcfbe] bg-white px-3 text-sm outline-none">
                  <option value="PRIVATE">Lista privata</option>
                  <option value="PUBLIC">Lista pubblica</option>
                </select>
                <button type="submit" disabled={isPending} className={buttonStyles({ className: "w-full" })}>
                  Crea e aggiungi
                </button>
              </form>
            ) : (
              <button type="button" className={buttonStyles({ variant: "secondary", className: "mt-5 w-full" })} onClick={() => setCreateOpen(true)}>
                Crea nuova lista
              </button>
            )}

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button type="button" className={buttonStyles({ variant: "secondary" })} onClick={() => setOpen(false)}>
                Annulla
              </button>
              <button type="button" disabled={isPending || selected.length === 0} className={buttonStyles()} onClick={saveToLists}>
                {isPending ? "Salvataggio..." : "Salva"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
