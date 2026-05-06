"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  createPerfumeList,
  deletePerfumeList,
  removePerfumeFromList,
  updatePerfumeList,
  type PerfumeListActionResult,
} from "@/app/perfume-lists/actions";
import { PerfumeImage } from "@/components/perfumes/PerfumeImage";
import { buttonStyles } from "@/components/ui/Button";
import type { AppLocale } from "@/lib/i18n";
import { Link } from "@/lib/navigation";
import type { UserPerfumeListSummary } from "@/lib/perfume-lists";

type PerfumeListsSectionProps = {
  locale: AppLocale;
  lists: UserPerfumeListSummary[];
};

type EditingState =
  | {
      mode: "create";
    }
  | {
      mode: "edit";
      list: UserPerfumeListSummary;
    }
  | null;

function getSharePath(locale: string, list: UserPerfumeListSummary) {
  return `/${locale}/lists/${list.id}-${list.slug}`;
}

function ListCover({ list }: { list: UserPerfumeListSummary }) {
  const previewItems = list.items.slice(0, 4);

  if (previewItems.length === 0) {
    return (
      <div className="flex h-44 items-center justify-center rounded-[1.35rem] border border-dashed border-[#d8c9b6] bg-[#fbf7f0] text-center sm:h-52">
        <div>
          <p className="font-display text-2xl text-[#21180f]">Lista vuota</p>
          <p className="mt-2 text-sm text-[#685747]">Aggiungi profumi dal catalogo.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid h-44 grid-cols-4 grid-rows-2 gap-2 rounded-[1.35rem] border border-[#e0d2c0] bg-[#f8f2e8] p-2 sm:h-52">
      {previewItems.map((item, index) => {
        const brandName = item.perfume.brand.name;
        const isMain = index === 0;

        return (
          <Link
            key={item.id}
            href={{ pathname: "/perfumes/[slug]", params: { slug: item.perfume.slug } }}
            className={[
              "relative overflow-hidden rounded-[1rem] border border-white/70 bg-white shadow-[0_14px_26px_-24px_rgba(53,39,27,0.42)]",
              isMain ? "col-span-2 row-span-2" : "",
              previewItems.length === 2 && index === 1 ? "col-span-2 row-span-2" : "",
              previewItems.length === 3 && index === 1 ? "col-span-2" : "",
              previewItems.length === 3 && index === 2 ? "col-span-2" : "",
            ].join(" ")}
            aria-label={`${item.perfume.name} di ${brandName}`}
          >
            <PerfumeImage
              imageUrl={item.perfume.imageUrl}
              perfumeName={item.perfume.name}
              brandName={brandName}
              fragranceFamily={item.perfume.fragranceFamily}
              sizes={isMain ? "18rem" : "9rem"}
              imageClassName="object-contain p-2"
            />
          </Link>
        );
      })}
    </div>
  );
}

export function PerfumeListsSection({ locale, lists }: PerfumeListsSectionProps) {
  const router = useRouter();
  const [editing, setEditing] = useState<EditingState>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleResult = (result: PerfumeListActionResult, successMessage: string) => {
    if (result.ok) {
      setError(null);
      setMessage(successMessage);
      setEditing(null);
      router.refresh();
      return;
    }

    setMessage(null);
    setError(result.error ?? "Operazione non riuscita.");
  };

  const handleBackgroundResult = (result: PerfumeListActionResult, successMessage: string) => {
    if (result.ok) {
      setError(null);
      setMessage(successMessage);
      router.refresh();
      return;
    }

    setMessage(null);
    setError(result.error ?? "Operazione non riuscita.");
  };

  const submitList = (formData: FormData) => {
    const input = {
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? ""),
      visibility: formData.get("visibility") === "PUBLIC" ? ("PUBLIC" as const) : ("PRIVATE" as const),
    };

    startTransition(async () => {
      const result =
        editing?.mode === "edit"
          ? await updatePerfumeList(editing.list.id, input)
          : await createPerfumeList(input);

      handleResult(result, editing?.mode === "edit" ? "Lista aggiornata." : "Lista creata.");
    });
  };

  const copyShareLink = async (list: UserPerfumeListSummary) => {
    if (list.visibility !== "PUBLIC") {
      setMessage(null);
      setError("Solo le liste pubbliche hanno un link condivisibile.");
      return;
    }

    const url = `${window.location.origin}${getSharePath(locale, list)}`;
    await navigator.clipboard.writeText(url);
    setError(null);
    setMessage("Link copiato.");
  };

  const removeList = (list: UserPerfumeListSummary) => {
    if (!window.confirm(`Eliminare "${list.name}"?`)) {
      return;
    }

    startTransition(async () => {
      handleResult(await deletePerfumeList(list.id), "Lista eliminata.");
    });
  };

  const removePerfume = (list: UserPerfumeListSummary, perfumeId: number, perfumeName: string) => {
    if (!window.confirm(`Rimuovere "${perfumeName}" da "${list.name}"?`)) {
      return;
    }

    startTransition(async () => {
      const result = await removePerfumeFromList(list.id, perfumeId);
      if (result.ok && editing?.mode === "edit" && editing.list.id === list.id) {
        setEditing({
          mode: "edit",
          list: {
            ...editing.list,
            itemCount: Math.max(0, editing.list.itemCount - 1),
            items: editing.list.items.filter((item) => item.perfumeId !== perfumeId),
          },
        });
      }
      handleBackgroundResult(result, "Profumo rimosso dalla lista.");
    });
  };

  return (
    <section className="rounded-[2rem] border border-[#ddcfbe] bg-[linear-gradient(180deg,#fffdf9,#f7f0e6)] p-6 shadow-[0_20px_46px_-34px_rgba(53,39,27,0.4)] sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8b7762]">
            Collezioni personali
          </p>
          <h2 className="mt-2 font-display text-3xl text-[#21180f]">Le tue liste</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#685747]">
            Crea selezioni private o condividi la tua collezione con chi vuoi.
          </p>
        </div>

        <button
          type="button"
          className={buttonStyles({ className: "w-full sm:w-auto" })}
          onClick={() => setEditing({ mode: "create" })}
        >
          Crea nuova lista
        </button>
      </div>

      {message ? (
        <div className="mt-5 rounded-xl border border-[#d1dbc3] bg-[#f3f8eb] px-3 py-2 text-sm text-[#4d6340]">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="mt-5 rounded-xl border border-[#dfcab0] bg-[#faf4eb] px-3 py-2 text-sm text-[#6d5644]">
          {error}
        </div>
      ) : null}

      {lists.length === 0 ? (
        <div className="mt-6 rounded-[1.6rem] border border-dashed border-[#d8c9b6] bg-[#fbf7f0] p-8 text-center">
          <p className="font-display text-2xl text-[#21180f]">Nessuna lista ancora</p>
          <p className="mt-2 text-sm text-[#685747]">Crea la tua prima selezione di profumi.</p>
        </div>
      ) : (
        <div className={lists.length === 1 ? "mt-6 grid gap-4" : "mt-6 grid gap-4 xl:grid-cols-2"}>
          {lists.map((list) => (
            <article
              key={list.id}
              className="grid gap-5 rounded-[1.65rem] border border-[#e0d2c0] bg-white/88 p-4 shadow-[0_18px_36px_-32px_rgba(53,39,27,0.35)] md:grid-cols-[minmax(15rem,0.82fr)_minmax(0,1fr)] md:p-5"
            >
              <ListCover list={list} />

              <div className="flex min-w-0 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-display text-3xl leading-none text-[#21180f]">{list.name}</h3>
                    {list.description ? (
                      <p className="mt-3 max-w-xl text-sm leading-6 text-[#685747]">{list.description}</p>
                    ) : null}
                  </div>
                  <span className="shrink-0 rounded-full border border-[#dfcfbc] bg-[#f8f2e8] px-3 py-1 text-[11px] font-semibold text-[#6b5948]">
                    {list.visibility === "PUBLIC" ? "Lista pubblica" : "Lista privata"}
                  </span>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-[#6b5948]">
                  <span className="rounded-full border border-[#eadfce] bg-[#fbf7f0] px-3 py-1">
                    {list.itemCount} {list.itemCount === 1 ? "profumo" : "profumi"}
                  </span>
                  {list.items.slice(0, 3).map((item) => (
                    <span key={item.id} className="max-w-[11rem] truncate rounded-full border border-[#eadfce] bg-white px-3 py-1">
                      {item.perfume.name}
                    </span>
                  ))}
                </div>

                <div className="mt-auto flex flex-wrap gap-2 pt-5">
                  <Link
                    href={{ pathname: "/lists/[listKey]", params: { listKey: `${list.id}-${list.slug}` } }}
                    className={buttonStyles({ size: "sm", className: "px-4" })}
                  >
                    Apri
                  </Link>
                  <button
                    type="button"
                    className={buttonStyles({ variant: "secondary", size: "sm", className: "px-4" })}
                    onClick={() => setEditing({ mode: "edit", list })}
                  >
                    Modifica
                  </button>
                  <button
                    type="button"
                    className={buttonStyles({ variant: "secondary", size: "sm", className: "px-4" })}
                    onClick={() => void copyShareLink(list)}
                  >
                    Copia link
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    className={buttonStyles({ variant: "ghost", size: "sm", className: "px-4 text-[#7c3f35]" })}
                    onClick={() => removeList(list)}
                  >
                    Elimina
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {editing ? (
        <div className="fixed inset-0 z-[120] flex items-end justify-center bg-[rgba(26,20,15,0.32)] px-4 py-5 backdrop-blur-sm sm:items-center">
          <form action={submitList} className="max-h-[calc(100dvh-2.5rem)] w-full max-w-2xl overflow-y-auto rounded-[1.8rem] border border-[#ddcfbe] bg-[#fffdf9] p-5 shadow-[0_34px_90px_-42px_rgba(36,25,16,0.65)] sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8b7762]">
                  {editing.mode === "edit" ? "Modifica lista" : "Nuova lista"}
                </p>
                <h3 className="mt-1 font-display text-3xl text-[#21180f]">
                  {editing.mode === "edit" ? editing.list.name : "Crea nuova lista"}
                </h3>
              </div>
              <button type="button" className="rounded-full px-3 py-1 text-sm text-[#6b5948]" onClick={() => setEditing(null)}>
                Chiudi
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block space-y-1.5 text-sm font-medium text-[#3a2e24]">
                <span>Nome</span>
                <input
                  name="name"
                  defaultValue={editing.mode === "edit" ? editing.list.name : ""}
                  className="h-11 w-full rounded-xl border border-[#ddcfbe] bg-white px-3 text-sm outline-none transition focus:border-[#bda88f]"
                  required
                />
              </label>
              <label className="block space-y-1.5 text-sm font-medium text-[#3a2e24]">
                <span>Descrizione</span>
                <textarea
                  name="description"
                  defaultValue={editing.mode === "edit" ? editing.list.description ?? "" : ""}
                  rows={3}
                  className="w-full rounded-xl border border-[#ddcfbe] bg-white px-3 py-2 text-sm outline-none transition focus:border-[#bda88f]"
                />
              </label>
              <label className="block space-y-1.5 text-sm font-medium text-[#3a2e24]">
                <span>Visibilita</span>
                <select
                  name="visibility"
                  defaultValue={editing.mode === "edit" ? editing.list.visibility : "PRIVATE"}
                  className="h-11 w-full rounded-xl border border-[#ddcfbe] bg-white px-3 text-sm outline-none transition focus:border-[#bda88f]"
                >
                  <option value="PRIVATE">Lista privata</option>
                  <option value="PUBLIC">Lista pubblica</option>
                </select>
              </label>
            </div>

            {editing.mode === "edit" ? (
              <div className="mt-6 rounded-[1.35rem] border border-[#e2d5c5] bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8b7762]">
                      Profumi nella lista
                    </p>
                    <p className="mt-1 text-sm text-[#685747]">
                      {editing.list.itemCount} {editing.list.itemCount === 1 ? "profumo salvato" : "profumi salvati"}
                    </p>
                  </div>
                </div>

                {editing.list.items.length === 0 ? (
                  <p className="mt-4 rounded-xl border border-dashed border-[#d8c9b6] bg-[#fbf7f0] p-4 text-sm text-[#685747]">
                    Questa lista non contiene ancora profumi.
                  </p>
                ) : (
                  <div className="mt-4 space-y-2">
                    {editing.list.items.map((item) => {
                      const brandName = item.perfume.brand.name;

                      return (
                        <div
                          key={item.id}
                          className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-3 rounded-2xl border border-[#eadfce] bg-[#fffdf9] p-2.5 sm:grid-cols-[4rem_minmax(0,1fr)_auto] sm:items-center"
                        >
                          <Link
                            href={{ pathname: "/perfumes/[slug]", params: { slug: item.perfume.slug } }}
                            className="relative h-16 overflow-hidden rounded-xl border border-[#e0d2c0] bg-[#f8f2e8]"
                          >
                            <PerfumeImage
                              imageUrl={item.perfume.imageUrl}
                              perfumeName={item.perfume.name}
                              brandName={brandName}
                              fragranceFamily={item.perfume.fragranceFamily}
                              sizes="4rem"
                              imageClassName="object-contain"
                            />
                          </Link>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold uppercase tracking-[0.14em] text-[#8b7762]">
                              {brandName}
                            </p>
                            <Link
                              href={{ pathname: "/perfumes/[slug]", params: { slug: item.perfume.slug } }}
                              className="mt-1 block truncate font-medium text-[#21180f]"
                            >
                              {item.perfume.name}
                            </Link>
                          </div>
                          <button
                            type="button"
                            disabled={isPending}
                            className={buttonStyles({
                              variant: "ghost",
                              size: "sm",
                              className: "col-span-2 w-full text-[#7c3f35] sm:col-span-1 sm:w-auto",
                            })}
                            onClick={() => removePerfume(editing.list, item.perfumeId, item.perfume.name)}
                          >
                            Rimuovi
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : null}

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button type="button" className={buttonStyles({ variant: "secondary" })} onClick={() => setEditing(null)}>
                Annulla
              </button>
              <button type="submit" disabled={isPending} className={buttonStyles()}>
                {isPending ? "Salvataggio..." : "Salva lista"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
