"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { toggleBrandFollow } from "@/app/[locale]/brands/[slug]/actions";
import { AuthModalTrigger } from "@/components/auth/AuthModalTrigger";
import { buttonStyles } from "@/components/ui/Button";
import { useAuthStatus } from "@/lib/supabase/use-auth-status";
import { cn } from "@/lib/utils";

type BrandFollowButtonProps = {
  brandId: number;
  brandName: string;
  initialIsFollowing: boolean;
  initialIsAuthenticated: boolean;
};

export function BrandFollowButton({
  brandId,
  brandName,
  initialIsFollowing,
  initialIsAuthenticated,
}: BrandFollowButtonProps) {
  const t = useTranslations("brand.page");
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isAuthenticated = useAuthStatus(initialIsAuthenticated, { refreshOnChange: true });

  const handleClick = () => {
    setError(null);
    startTransition(async () => {
      const result = await toggleBrandFollow(brandId);
      if (!result.ok) {
        setError(t("followError"));
        return;
      }
      setIsFollowing(result.following);
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col gap-2">
        <AuthModalTrigger
          mode="login"
          className={buttonStyles({ variant: "secondary", size: "sm" })}
          aria-label={t("followToggleAria", { name: brandName })}
        >
          {t("follow")}
        </AuthModalTrigger>
        <p className="text-[12px] text-[#907b66]">{t("followLoginHint")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        aria-pressed={isFollowing}
        aria-label={t("followToggleAria", { name: brandName })}
        className={cn(
          buttonStyles({ variant: isFollowing ? "primary" : "secondary", size: "sm" }),
          isPending && "opacity-60",
        )}
      >
        {isFollowing ? t("following") : t("follow")}
      </button>
      <p className="text-[12px] text-[#907b66]">
        {error ?? t("followHint")}
      </p>
    </div>
  );
}
