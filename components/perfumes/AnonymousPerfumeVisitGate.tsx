"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { AuthModalTrigger } from "@/components/auth/AuthModalTrigger";
import { buttonStyles } from "@/components/ui/Button";

const VISITED_SLUGS_KEY = "odora.anonymousPerfumeVisits";
const SESSION_DISMISSED_KEY = "odora.anonymousPerfumeGateDismissed";
const VISIT_LIMIT = 3;

type AnonymousPerfumeVisitGateProps = {
  isAuthenticated: boolean;
  loginNextPath: string;
  perfumeSlug: string;
};

function readVisitedSlugs() {
  try {
    const rawValue = window.localStorage.getItem(VISITED_SLUGS_KEY);
    const parsed = rawValue ? JSON.parse(rawValue) : [];
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function writeVisitedSlugs(slugs: string[]) {
  try {
    window.localStorage.setItem(VISITED_SLUGS_KEY, JSON.stringify(slugs.slice(-24)));
  } catch {
    // Ignore storage failures; the page should remain usable.
  }
}

export function AnonymousPerfumeVisitGate({
  isAuthenticated,
  loginNextPath,
  perfumeSlug,
}: AnonymousPerfumeVisitGateProps) {
  const t = useTranslations("perfume.anonymousGate");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated || !perfumeSlug) {
      return;
    }

    const visitedSlugs = readVisitedSlugs();
    const nextVisitedSlugs = visitedSlugs.includes(perfumeSlug)
      ? visitedSlugs
      : [...visitedSlugs, perfumeSlug];
    writeVisitedSlugs(nextVisitedSlugs);

    let frameId: number | null = null;
    if (
      nextVisitedSlugs.length >= VISIT_LIMIT &&
      window.sessionStorage.getItem(SESSION_DISMISSED_KEY) !== "1"
    ) {
      frameId = window.requestAnimationFrame(() => setOpen(true));
    }

    return () => {
      if (frameId != null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [isAuthenticated, perfumeSlug]);

  if (!open) {
    return null;
  }

  const handleClose = () => {
    try {
      window.sessionStorage.setItem(SESSION_DISMISSED_KEY, "1");
    } catch {
      // Ignore storage failures; closing the modal is still allowed.
    }
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-end justify-center bg-[rgba(26,20,15,0.38)] px-0 backdrop-blur-sm sm:items-center sm:px-4 sm:py-8">
      <div className="w-full max-w-md rounded-t-3xl border border-[#ddcfbe] bg-[#fffdf9]/98 p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] shadow-[0_34px_90px_-42px_rgba(36,25,16,0.65)] sm:rounded-2xl sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8b7762]">
          {t("eyebrow")}
        </p>
        <h3 className="mt-2 font-display text-3xl leading-tight text-[#21180f]">
          {t("title")}
        </h3>
        <p className="mt-3 text-sm leading-6 text-[#685747]">
          {t("description", { count: VISIT_LIMIT })}
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <AuthModalTrigger
            mode="login"
            resolveNextPath={() => loginNextPath}
            onOpen={() => setOpen(false)}
            className={buttonStyles({ className: "w-full rounded-2xl sm:w-auto" })}
          >
            {t("login")}
          </AuthModalTrigger>
          <button
            type="button"
            className={buttonStyles({ variant: "secondary", className: "w-full rounded-2xl sm:w-auto" })}
            onClick={handleClose}
          >
            {t("continue")}
          </button>
        </div>
      </div>
    </div>
  );
}
