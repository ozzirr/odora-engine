"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

type AuthSocialButtonsProps = {
  nextPath: string;
};

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
      <Button
        type="button"
        variant="secondary"
        className="w-full"
        disabled={isPending}
        onClick={() => void handleGoogleLogin()}
      >
        {isPending ? t("redirecting") : t("continueWithGoogle")}
      </Button>

      {error ? (
        <div className="rounded-xl border border-[#dfcab0] bg-[#faf4eb] px-3 py-2 text-sm text-[#6d5644]">
          {error}
        </div>
      ) : null}
    </div>
  );
}
