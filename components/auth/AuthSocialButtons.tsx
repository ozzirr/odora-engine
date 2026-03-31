"use client";

import { useState } from "react";
import { type Provider } from "@supabase/supabase-js";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

type AuthSocialButtonsProps = {
  nextPath: string;
};

const providers: Array<{ id: Provider; label: string }> = [
  { id: "google", label: "Google" },
  { id: "apple", label: "Apple" },
  { id: "facebook", label: "Facebook" },
];

export function AuthSocialButtons({ nextPath }: AuthSocialButtonsProps) {
  const t = useTranslations("auth.social");
  const [pendingProvider, setPendingProvider] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleProviderLogin(provider: Provider, providerLabel: string) {
    setError(null);
    setPendingProvider(provider);

    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (oauthError || !data.url) {
        throw oauthError ?? new Error(`Missing OAuth redirect URL for ${providerLabel}`);
      }

      window.location.assign(data.url);
    } catch {
      setPendingProvider(null);
      setError(t("oauthFailed", { provider: providerLabel }));
    }
  }

  return (
    <div className="grid gap-2">
      {providers.map(({ id, label }) => {
        const isPending = pendingProvider === id;

        return (
          <Button
            key={id}
            type="button"
            variant="secondary"
            className="w-full"
            disabled={pendingProvider !== null}
            onClick={() => void handleProviderLogin(id, label)}
          >
            {isPending ? t("redirecting") : t("continueWith", { provider: label })}
          </Button>
        );
      })}

      {error ? (
        <div className="rounded-xl border border-[#dfcab0] bg-[#faf4eb] px-3 py-2 text-sm text-[#6d5644]">
          {error}
        </div>
      ) : null}
    </div>
  );
}
