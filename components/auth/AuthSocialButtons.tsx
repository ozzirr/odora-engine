"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type AuthSocialButtonsProps = {
  nextPath: string;
};

function GoogleIcon() {
  return (
    <svg viewBox="0 0 18 18" aria-hidden="true" className="h-[18px] w-[18px]">
      <path
        fill="#4285F4"
        d="M17.64 9.2045c0-.6382-.0573-1.2518-.1636-1.8409H9v3.4818h4.8436a4.1405 4.1405 0 0 1-1.7972 2.7164v2.2582h2.9086c1.7018-1.5664 2.685-3.8746 2.685-6.6155Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.4673-.8059 5.9564-2.1791l-2.9086-2.2582c-.8059.54-1.8368.8591-3.0478.8591-2.3428 0-4.3268-1.5827-5.0359-3.7105H.9573v2.3291A8.9987 8.9987 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.9641 10.7104A5.4098 5.4098 0 0 1 3.6827 9c0-.5932.1023-1.1701.2814-1.7105V4.9604H.9573A8.9985 8.9985 0 0 0 0 9c0 1.4523.3477 2.8277.9573 4.0391l3.0068-2.3287Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.5795c1.3214 0 2.5082.4541 3.4418 1.345l2.5814-2.5814C13.4636.8918 11.4264 0 9 0A8.9987 8.9987 0 0 0 .9573 4.9604l3.0068 2.3286C4.6732 5.1623 6.6572 3.5795 9 3.5795Z"
      />
    </svg>
  );
}

export function AuthSocialButtons({ nextPath }: AuthSocialButtonsProps) {
  const t = useTranslations("auth.social");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogleLogin() {
    setError(null);
    setIsPending(true);

    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (oauthError || !data.url) {
        throw oauthError ?? new Error("Missing OAuth redirect URL for Google");
      }

      window.location.assign(data.url);
    } catch {
      setIsPending(false);
      setError(t("oauthFailed"));
    }
  }

  return (
    <div className="grid gap-2">
      <button
        type="button"
        className={cn(
          "inline-flex h-12 w-full items-center justify-center rounded-full px-5 text-base font-semibold transition-colors",
          "bg-[#4285F4] text-white shadow-[0_18px_42px_-28px_rgba(66,133,244,0.85)]",
          "hover:bg-[#3B78E7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4285F4]",
          "disabled:cursor-wait disabled:opacity-85",
        )}
        disabled={isPending}
        onClick={() => void handleGoogleLogin()}
      >
        <span className="absolute sr-only">{t("continueWithGoogle")}</span>
        <span className="inline-flex items-center gap-3">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-white shadow-[inset_0_0_0_1px_rgba(66,133,244,0.08)]">
            <GoogleIcon />
          </span>
          <span>{isPending ? t("redirecting") : t("continueWithGoogle")}</span>
        </span>
      </button>

      {error ? (
        <div className="rounded-xl border border-[#dfcab0] bg-[#faf4eb] px-3 py-2 text-sm text-[#6d5644]">
          {error}
        </div>
      ) : null}
    </div>
  );
}
