"use client";

import { useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";

import {
  addPerfumeToLists,
  createListAndAddPerfume,
} from "@/app/perfume-lists/actions";
import { AuthModalTrigger } from "@/components/auth/AuthModalTrigger";
import { buttonStyles } from "@/components/ui/Button";
import type { UserPerfumeListForPerfume } from "@/lib/perfume-lists";

const ADD_TO_LIST_INTENT = "add-to-list";
const AUTH_INTENT_PARAM = "authIntent";

type AddToListButtonProps = {
  perfumeId: number;
  isAuthenticated: boolean;
  lists: UserPerfumeListForPerfume[];
  loginNextPath: string;
  variant?: "card" | "compact";
  className?: string;
};

export function AddToListButton({
  perfumeId,
  isAuthenticated,
  lists,
  loginNextPath,
  variant = "card",
  className,
}: AddToListButtonProps) {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isClient = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const addLabel = locale === "it" ? "Aggiungi ai preferiti" : "Add to favorites";
  const restoredIntentRef = useRef(false);

  const resolveAddToListNextPath = () => {
    const nextUrl = new URL(loginNextPath, window.location.origin);
    nextUrl.searchParams.set(AUTH_INTENT_PARAM, ADD_TO_LIST_INTENT);
    return `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
  };

  useEffect(() => {
    if (!isAuthenticated || restoredIntentRef.current) {
      return;
    }

    if (searchParams.get(AUTH_INTENT_PARAM) !== ADD_TO_LIST_INTENT) {
      return;
    }

    const nextParams = new URLSearchParams(window.location.search);
    nextParams.delete(AUTH_INTENT_PARAM);
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${nextParams.toString() ? `?${nextParams.toString()}` : ""}${window.location.hash}`,
    );

    restoredIntentRef.current = true;
    window.setTimeout(() => {
      setOpen(true);

      if (lists.length === 0) {
        setCreateOpen(true);
      }
    }, 0);
  }, [isAuthenticated, lists.length, searchParams]);

  if (!isAuthenticated) {
    if (variant === "compact") {
      return (
        <AuthModalTrigger
          mode="login"
          resolveNextPath={resolveAddToListNextPath}
          className={buttonStyles({ className })}
        >
          {addLabel}
        </AuthModalTrigger>
      );
    }

    return (
      <div className="rounded-[1.45rem] border border-[#ddcfbc] bg-[#fffdf9] p-4">
        <p className="font-display text-2xl text-[#21180f]">Aggiungi ai preferiti</p>
        <p className="mt-1 text-sm leading-6 text-[#685747]">
          Accedi o registrati per salvare questo profumo nelle tue liste.
        </p>
        <AuthModalTrigger
          mode="login"
          resolveNextPath={resolveAddToListNextPath}
          className={buttonStyles({ className: "mt-4 w-full sm:w-auto" })}
        >
          {addLabel}
        </AuthModalTrigger>
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

  const trigger =
    variant === "compact" ? (
      <button type="button" className={buttonStyles({ className })} onClick={() => setOpen(true)}>
        <span className="inline-flex items-center justify-center gap-2">
          <span aria-hidden="true">＋</span>
          <span>{addLabel}</span>
        </span>
      </button>
    ) : (
      <div className="rounded-[1.45rem] border border-[#ddcfbc] bg-[#fffdf9] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-2xl text-[#21180f]">Aggiungi a lista</p>
            <p className="mt-1 text-sm text-[#685747]">Salva questo profumo in una o piu selezioni personali.</p>
          </div>
          <button type="button" className={buttonStyles({ className: "w-full sm:w-auto" })} onClick={() => setOpen(true)}>
            {addLabel}
          </button>
        </div>

        {message ? <p className="mt-3 text-sm text-[#4d6340]">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-[#7c3f35]">{error}</p> : null}
      </div>
    );

  const modal = open ? (
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
  ) : null;

  return (
    <>
      {trigger}
      {isClient && modal ? createPortal(modal, document.body) : null}
    </>
  );
}
