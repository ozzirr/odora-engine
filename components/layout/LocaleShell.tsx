"use client";

import { useEffect } from "react";
import { usePathname as useActivePathname } from "@/lib/navigation";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { AuthPanel } from "@/components/auth/AuthPanel";
import { mapLoginAuthError } from "@/components/auth/auth-errors";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

type LocaleShellProps = {
  children: React.ReactNode;
};

type AuthMode = "login" | "signup";

function getAuthMode(value: string | null): AuthMode | null {
  return value === "login" || value === "signup" ? value : null;
}

function getBasePath(pathname: string, searchParams: URLSearchParams, hash: string) {
  const params = new URLSearchParams(searchParams);
  params.delete("auth");
  params.delete("authNext");
  params.delete("error");
  const search = params.toString();
  return `${pathname}${search ? `?${search}` : ""}${hash}`;
}

export function LocaleShell({ children }: LocaleShellProps) {
  const t = useTranslations("auth.login.page");
  const router = useRouter();
  const pathname = usePathname();
  const activePathname = useActivePathname();
  const searchParams = useSearchParams();
  const isStandaloneAuthPage = activePathname === "/login" || activePathname === "/signup";
  const mode = isStandaloneAuthPage ? null : getAuthMode(searchParams.get("auth"));
  const modalOpen = mode !== null;
  const currentParams = new URLSearchParams(searchParams.toString());
  const authNext = searchParams.get("authNext");
  const nextPath = authNext || getBasePath(pathname, currentParams, "");
  const initialError = mode === "login" ? mapLoginAuthError(searchParams.get("error") ?? undefined, t) : undefined;

  const updateUrl = (nextMode: AuthMode | null) => {
    const params = new URLSearchParams(searchParams.toString());

    if (nextMode) {
      const preservedNext = params.get("authNext") || getBasePath(pathname, params, window.location.hash);
      params.delete("error");
      params.set("auth", nextMode);
      params.set("authNext", preservedNext);
    } else {
      params.delete("auth");
      params.delete("authNext");
      params.delete("error");
    }

    const search = params.toString();
    router.replace(`${pathname}${search ? `?${search}` : ""}${window.location.hash}`, { scroll: false });
  };

  const closeModal = () => {
    updateUrl(null);
  };

  const switchMode = (nextMode: AuthMode) => {
    updateUrl(nextMode);
  };

  useEffect(() => {
    if (!modalOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [modalOpen]);

  useEffect(() => {
    if (!modalOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("auth");
        params.delete("authNext");
        params.delete("error");
        const search = params.toString();
        router.replace(`${pathname}${search ? `?${search}` : ""}${window.location.hash}`, { scroll: false });
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalOpen, pathname, router, searchParams]);

  return (
    <div className="min-h-screen bg-[#fbf8f2] text-[#211a14]">
      <div
        aria-hidden={modalOpen}
        className={cn(
          "min-h-screen transition duration-300 ease-out",
          modalOpen && "pointer-events-none select-none blur-[14px] saturate-[0.82] scale-[0.995]",
        )}
      >
        <Header />
        <main>{children}</main>
        <Footer />
      </div>

      {mode ? (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-[rgba(24,20,16,0.22)] px-4 py-6 backdrop-blur-[18px] sm:px-6 sm:py-10"
          onClick={() => closeModal()}
        >
          <div className="flex min-h-full items-center justify-center">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="auth-modal-title"
              onClick={(event) => event.stopPropagation()}
              className="w-full"
            >
              <AuthPanel
                mode={mode}
                nextPath={nextPath}
                initialError={initialError}
                titleId="auth-modal-title"
                onClose={() => closeModal()}
                onSwitchMode={(nextMode) => switchMode(nextMode)}
                surface="glass"
                className="relative overflow-hidden before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.42),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(226,211,192,0.28),transparent_34%)] before:content-['']"
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
