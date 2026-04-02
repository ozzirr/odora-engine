"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname as useActivePathname } from "@/lib/navigation";
import { usePathname, useSearchParams } from "next/navigation";

import { AuthPanel } from "@/components/auth/AuthPanel";
import { mapLoginAuthError } from "@/components/auth/auth-errors";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { PerfumeDetailNavigationProvider } from "@/components/perfumes/PerfumeDetailNavigation";
import {
  buildAuthModalUrl,
  buildPathWithoutAuthModal,
  getAuthMode,
  type AuthMode,
} from "@/lib/auth-modal";
import { APP_HEADER_OFFSET_CLASS, APP_OVERLAY_LAYER_CLASS } from "@/lib/chrome";
import { lockDocumentScroll } from "@/lib/document-scroll-lock";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

type LocaleShellProps = {
  children: React.ReactNode;
  hideChrome?: boolean;
  initialIsAuthenticated?: boolean;
};

type AuthModalOverlayProps = {
  isStandaloneAuthPage: boolean;
};

const AUTH_MODAL_TRANSITION_MS = 260;

function AuthModalOverlay({ isStandaloneAuthPage }: AuthModalOverlayProps) {
  const t = useTranslations("auth.login.page");
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mode = isStandaloneAuthPage ? null : getAuthMode(searchParams.get("auth"));
  const [renderedMode, setRenderedMode] = useState<AuthMode | null>(mode);
  const [isVisible, setIsVisible] = useState(Boolean(mode));
  const closeTimeoutRef = useRef<number | null>(null);
  const authNext = searchParams.get("authNext");
  const nextPath = authNext || buildPathWithoutAuthModal(pathname, searchParams, "");
  const initialError =
    renderedMode === "login" ? mapLoginAuthError(searchParams.get("error") ?? undefined, t) : undefined;

  const updateUrl = (nextMode: AuthMode | null) => {
    const nextUrl = nextMode
      ? buildAuthModalUrl(pathname, searchParams, nextMode, window.location.hash)
      : buildPathWithoutAuthModal(pathname, searchParams, window.location.hash);

    window.history.replaceState(null, "", nextUrl);
  };

  const closeModal = () => {
    updateUrl(null);
  };

  const switchMode = (nextMode: AuthMode) => {
    updateUrl(nextMode);
  };

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        window.clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    if (mode) {
      const frameId = window.requestAnimationFrame(() => {
        setRenderedMode(mode);
        setIsVisible(true);
      });

      return () => window.cancelAnimationFrame(frameId);
    }

    if (!renderedMode) {
      const frameId = window.requestAnimationFrame(() => {
        setIsVisible(false);
      });

      return () => window.cancelAnimationFrame(frameId);
    }

    const frameId = window.requestAnimationFrame(() => {
      setIsVisible(false);
    });

    closeTimeoutRef.current = window.setTimeout(() => {
      setRenderedMode(null);
      closeTimeoutRef.current = null;
    }, AUTH_MODAL_TRANSITION_MS);

    return () => {
      window.cancelAnimationFrame(frameId);

      if (closeTimeoutRef.current) {
        window.clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
    };
  }, [mode, renderedMode]);

  useEffect(() => {
    if (!renderedMode) {
      return;
    }

    return lockDocumentScroll();
  }, [renderedMode]);

  useEffect(() => {
    if (!renderedMode) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        window.history.replaceState(
          null,
          "",
          buildPathWithoutAuthModal(pathname, searchParams, window.location.hash),
        );
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pathname, renderedMode, searchParams]);

  if (!renderedMode) {
    return null;
  }

  return (
    <div
      className={cn(
        `fixed inset-x-0 bottom-0 ${APP_HEADER_OFFSET_CLASS} overflow-y-auto px-4 py-6 transition-[background-color,opacity,backdrop-filter] duration-[260ms] ease-[cubic-bezier(0.22,1,0.36,1)] sm:px-6 sm:py-10`,
        APP_OVERLAY_LAYER_CLASS,
        isVisible
          ? "bg-[rgba(24,20,16,0.22)] opacity-100 backdrop-blur-[18px]"
          : "pointer-events-none bg-[rgba(24,20,16,0)] opacity-0 backdrop-blur-none",
      )}
      onClick={() => closeModal()}
    >
      <div className="flex min-h-full items-center justify-center">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
          onClick={(event) => event.stopPropagation()}
          className={cn(
            "w-full max-w-md transition-[opacity,transform] duration-[260ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
            isVisible ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-[0.985] opacity-0",
          )}
        >
          <AuthPanel
            mode={renderedMode}
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
  );
}

export function LocaleShell({
  children,
  hideChrome = false,
  initialIsAuthenticated = false,
}: LocaleShellProps) {
  const activePathname = useActivePathname();
  const isStandaloneAuthPage = activePathname === "/login" || activePathname === "/signup";

  return (
    <PerfumeDetailNavigationProvider>
      <div className="min-h-screen bg-[#fbf8f2] text-[#211a14]">
        {hideChrome ? null : <Header initialIsAuthenticated={initialIsAuthenticated} />}
        <div
          data-mobile-menu-content="true"
          className={cn("min-h-screen transition-[filter,opacity,transform] duration-300 ease-out")}
        >
          <main>{children}</main>
          {hideChrome ? null : <Footer />}
        </div>

        {hideChrome ? null : (
          <Suspense fallback={null}>
            <AuthModalOverlay isStandaloneAuthPage={isStandaloneAuthPage} />
          </Suspense>
        )}
      </div>
    </PerfumeDetailNavigationProvider>
  );
}
