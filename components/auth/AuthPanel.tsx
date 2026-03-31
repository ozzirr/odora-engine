"use client";

import { useTranslations } from "next-intl";

import { AuthSocialButtons } from "@/components/auth/AuthSocialButtons";
import { LoginForm } from "@/components/auth/LoginForm";
import { SignupForm } from "@/components/auth/SignupForm";
import { Link } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type AuthMode = "login" | "signup";

type AuthPanelProps = {
  mode: AuthMode;
  nextPath: string;
  initialError?: string;
  titleId?: string;
  onClose?: () => void;
  onSwitchMode?: (mode: AuthMode) => void;
  switchHref?: "/login" | "/signup";
  surface?: "solid" | "glass";
  className?: string;
};

const surfaceClasses = {
  solid: "border border-[#ddcfbe] bg-[#fffdf9] shadow-[0_20px_46px_-34px_rgba(53,39,27,0.4)]",
  glass:
    "border border-white/55 bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(248,242,234,0.52))] shadow-[0_40px_120px_-40px_rgba(29,22,16,0.62)] backdrop-blur-[28px]",
} as const;

export function AuthPanel({
  mode,
  nextPath,
  initialError,
  titleId,
  onClose,
  onSwitchMode,
  switchHref,
  surface = "solid",
  className,
}: AuthPanelProps) {
  const isLogin = mode === "login";
  const t = useTranslations(isLogin ? "auth.login.page" : "auth.signup.page");
  const switchMode = isLogin ? "signup" : "login";
  const switchText = isLogin ? t("signupLink") : t("loginLink");
  const switchPrompt = isLogin ? t("signupPrompt") : t("loginPrompt");

  return (
    <div
      className={cn(
        "relative isolate mx-auto max-w-md rounded-[2rem] p-6 sm:p-8",
        surfaceClasses[surface],
        className,
      )}
    >
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close authentication dialog"
          className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/45 bg-white/40 text-xl leading-none text-[#47372a] transition hover:bg-white/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E4B3B]"
        >
          <span aria-hidden="true">×</span>
        </button>
      ) : null}

      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8b7762]">{t("eyebrow")}</p>
      <h1 id={titleId} className="mt-2 pr-10 font-display text-4xl text-[#21180f]">
        {t("title")}
      </h1>
      <p className="mt-2 text-sm text-[#685747]">{t("subtitle")}</p>

      {isLogin ? (
        <LoginForm nextPath={nextPath} initialError={initialError} />
      ) : (
        <SignupForm nextPath={nextPath} initialError={initialError} />
      )}

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-[#e4d8c9]" />
        <span className="text-xs uppercase tracking-[0.1em] text-[#8b7762]">{t("or")}</span>
        <span className="h-px flex-1 bg-[#e4d8c9]" />
      </div>

      <AuthSocialButtons nextPath={nextPath} />

      <p className="mt-6 text-sm text-[#675545]">
        {switchPrompt}{" "}
        {onSwitchMode ? (
          <button
            type="button"
            onClick={() => onSwitchMode(switchMode)}
            className="font-semibold text-[#2b2118] underline-offset-2 hover:underline"
          >
            {switchText}
          </button>
        ) : (
          <Link
            href={switchHref ?? (isLogin ? "/signup" : "/login")}
            className="font-semibold text-[#2b2118] underline-offset-2 hover:underline"
          >
            {switchText}
          </Link>
        )}
      </p>

      <p className="mt-3 text-xs text-[#8b7762]">{t("socialNotice")}</p>
    </div>
  );
}
