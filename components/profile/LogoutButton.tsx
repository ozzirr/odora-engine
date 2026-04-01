"use client";

import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";

import { buttonStyles } from "@/components/ui/Button";

export function LogoutButton() {
  const t = useTranslations("profile.page");
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={buttonStyles({ variant: "secondary", className: "w-full" })}
    >
      {pending ? (
        <span className="inline-flex items-center justify-center gap-2">
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
          />
          {t("logoutPending")}
        </span>
      ) : (
        t("logout")
      )}
    </button>
  );
}
