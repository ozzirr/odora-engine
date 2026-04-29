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
      <div className="rounded-[1.35rem] border border-[#e4d8c8] bg-[#fbf7f0] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#2a2018]">{t("followTitle", { name: brandName })}</p>
            <p className="mt-1 text-[12.5px] leading-5 text-[#806b56]">{t("followLoginHint")}</p>
          </div>
          <AuthModalTrigger
            mode="login"
            className={buttonStyles({ variant: "primary", size: "sm", className: "w-full shrink-0 sm:w-auto" })}
            aria-label={t("followToggleAria", { name: brandName })}
          >
            {t("follow")}
          </AuthModalTrigger>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[1.35rem] border border-[#e4d8c8] bg-[#fbf7f0] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#2a2018]">{t("followTitle", { name: brandName })}</p>
          <p className={cn("mt-1 text-[12.5px] leading-5", error ? "text-[#8a4036]" : "text-[#806b56]")}>
            {error ?? t("followHint")}
          </p>
        </div>
        <button
          type="button"
          onClick={handleClick}
          disabled={isPending}
          aria-pressed={isFollowing}
          aria-label={t("followToggleAria", { name: brandName })}
          className={cn(
            buttonStyles({
              variant: isFollowing ? "primary" : "secondary",
              size: "sm",
              className: "w-full shrink-0 sm:w-auto",
            }),
            isPending && "opacity-60",
          )}
        >
          {isFollowing ? t("following") : t("follow")}
        </button>
      </div>
    </div>
  );
}
