"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { toggleSavePerfumeList } from "@/app/perfume-lists/actions";

type SaveListButtonProps = {
  listId: number;
  initialSaved: boolean;
  initialCount: number;
  isAuthenticated: boolean;
  isOwner: boolean;
};

const baseClass =
  "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition";

export function SaveListButton({
  listId,
  initialSaved,
  initialCount,
  isAuthenticated,
  isOwner,
}: SaveListButtonProps) {
  const t = useTranslations("publicList.page");
  const locale = useLocale();
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [count, setCount] = useState(initialCount);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    setError(null);

    if (!isAuthenticated) {
      const loginPath = locale === "it" ? "/it/accedi" : "/en/login";
      const next = encodeURIComponent(window.location.pathname);
      router.push(`${loginPath}?next=${next}`);
      return;
    }

    startTransition(async () => {
      const result = await toggleSavePerfumeList(listId);
      if (!result.ok) {
        setError(result.error ?? t("saveError"));
        return;
      }
      setSaved(result.saved);
      setCount(result.saveCount);
    });
  }

  if (isOwner) {
    return (
      <span className={`${baseClass} cursor-default border border-[#ddcfbe] bg-white text-[#8b7762]`}>
        {t("ownerBadge")} · {t("savedByCount", { count })}
      </span>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className={
          saved
            ? `${baseClass} bg-[#1f4b3b] text-white hover:bg-[#173a2d] disabled:opacity-60`
            : `${baseClass} bg-[#1f1914] text-white hover:bg-[#3a2e24] disabled:opacity-60`
        }
      >
        {saved ? `✓ ${t("saved")}` : t("saveAction")}
        {count > 0 ? (
          <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-semibold">
            {count}
          </span>
        ) : null}
      </button>
      {error ? <p className="text-[11px] text-[#a04040]">{error}</p> : null}
    </div>
  );
}
