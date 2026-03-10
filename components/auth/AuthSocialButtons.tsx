import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/Button";

type AuthSocialButtonsProps = {
  mode: "login" | "signup";
};

export function AuthSocialButtons({ mode }: AuthSocialButtonsProps) {
  const t = useTranslations("auth.social");
  const labelPrefix = mode === "login" ? t("loginPrefix") : t("signupPrefix");

  return (
    <div className="grid gap-2">
      <Button type="button" variant="secondary" className="w-full" disabled>
        {t("providerSoon", { prefix: labelPrefix, provider: "Google" })}
      </Button>
      <Button type="button" variant="secondary" className="w-full" disabled>
        {t("providerSoon", { prefix: labelPrefix, provider: "Apple" })}
      </Button>
      <Button type="button" variant="secondary" className="w-full" disabled>
        {t("providerSoon", { prefix: labelPrefix, provider: "Facebook" })}
      </Button>
    </div>
  );
}
