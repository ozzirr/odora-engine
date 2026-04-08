"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { AuthModalTrigger } from "@/components/auth/AuthModalTrigger";
import { SearchDialog } from "@/components/search/SearchDialog";
import { buttonStyles } from "@/components/ui/Button";
import { buildPathWithoutAuthModal, getAuthMode } from "@/lib/auth-modal";
import {
  APP_HEADER_HEIGHT_CLASS,
  APP_HEADER_LAYER_CLASS,
  APP_HEADER_OFFSET_CLASS,
} from "@/lib/chrome";
import { lockDocumentScroll } from "@/lib/document-scroll-lock";
import { Link, usePathname } from "@/lib/navigation";
import { useAuthStatus } from "@/lib/supabase/use-auth-status";
import { cn } from "@/lib/utils";

type HeaderProps = {
  initialIsAuthenticated?: boolean;
};

const SEARCH_BTN_CLASS =
  "flex w-full items-center gap-3 rounded-[1.4rem] border border-[#eadfce] bg-white/80 px-4 py-3.5 text-[#3d3026] transition-all hover:border-[#d6c3ac] hover:bg-[#fffdf9]";

const SearchIcon = () => (
  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f3eadf] text-[#8b735d]">
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
      <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M14 14l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  </span>
);

function MobileSearchButton({
  isAuthenticated,
  label,
  onOpenSearch,
  onCloseMenu,
}: {
  isAuthenticated: boolean;
  label: string;
  onOpenSearch: () => void;
  onCloseMenu: () => void;
}) {
  if (isAuthenticated) {
    return (
      <button type="button" onClick={onOpenSearch} className={SEARCH_BTN_CLASS}>
        <SearchIcon />
        <span className="text-base font-medium">{label}</span>
      </button>
    );
  }

  return (
    <Suspense
      fallback={
        <button type="button" className={SEARCH_BTN_CLASS}>
          <SearchIcon />
          <span className="text-base font-medium">{label}</span>
        </button>
      }
    >
      <AuthModalTrigger mode="login" onOpen={onCloseMenu} className={SEARCH_BTN_CLASS}>
        <SearchIcon />
        <span className="text-base font-medium">{label}</span>
      </AuthModalTrigger>
    </Suspense>
  );
}

export function Header({ initialIsAuthenticated = false }: HeaderProps) {
  const t = useTranslations("layout.header");
  const searchT = useTranslations("layout.header.search");
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const isAuthenticated = useAuthStatus(initialIsAuthenticated, { refreshOnChange: true });
  const navItems = [
    { href: "/" as const, label: t("nav.home") },
    { href: "/perfumes" as const, label: t("nav.perfumes") },
    { href: "/finder" as const, label: t("nav.finder") },
    { href: "/top" as const, label: t("nav.top") },
    { href: "/blog" as const, label: t("nav.blog") },
  ];
  const accountHref = isAuthenticated ? "/profile" : "/login";
  const accountLabel = isAuthenticated ? t("account.profile") : t("account.login");
  const canOpenAuthModal = !isAuthenticated && pathname !== "/login" && pathname !== "/signup";
  const authModalOpen = getAuthMode(searchParams.get("auth")) !== null;

  const isActivePath = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(href);
  };

  useEffect(() => {
    if (!menuOpen || authModalOpen) {
      return;
    }

    const releaseScrollLock = lockDocumentScroll();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      releaseScrollLock();
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen, authModalOpen]);

  useEffect(() => {
    const root = document.documentElement;

    if (menuOpen) {
      root.setAttribute("data-mobile-menu-open", "true");
    } else {
      root.removeAttribute("data-mobile-menu-open");
    }

    return () => {
      root.removeAttribute("data-mobile-menu-open");
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen || !authModalOpen) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      setMenuOpen(false);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [menuOpen, authModalOpen]);

  const handleMenuToggle = () => {
    if (authModalOpen) {
      window.history.replaceState(
        null,
        "",
        buildPathWithoutAuthModal(pathname, searchParams, window.location.hash),
      );

      window.requestAnimationFrame(() => {
        setMenuOpen(true);
      });
      return;
    }

    setMenuOpen((prev) => !prev);
  };

  return (
    <>
    <header className={cn("sticky top-0 border-b border-[#ede4d8] bg-[#fbf8f2]/96 backdrop-blur-lg backdrop-saturate-125", APP_HEADER_LAYER_CLASS)}>
      <div className={cn("mx-auto flex w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8", APP_HEADER_HEIGHT_CLASS)}>
        <Link
          href="/"
          onClick={() => setMenuOpen(false)}
          className="relative block h-12 w-[190px] sm:w-[220px]"
        >
          <Image
            src="/images/odora_logo_m.png"
            alt="Odora"
            fill
            priority
            sizes="(max-width: 640px) 190px, 220px"
            className="object-contain object-left"
          />
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-[13.5px] font-medium text-[#6b5a49] transition-colors hover:text-[#1e1813]",
                isActivePath(item.href) && "text-[#1e1813]",
              )}
            >
              {item.label}
            </Link>
          ))}

          {/* Search trigger — desktop */}
          {isAuthenticated ? (
            <button
              type="button"
              aria-label={searchT("label")}
              onClick={() => setSearchOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#ddd0bf] bg-white/60 text-[#7a6a58] transition-colors hover:border-[#c9b89e] hover:text-[#3d2e22]"
            >
              <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
                <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.6" />
                <path d="M14 14l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          ) : (
            <Suspense fallback={null}>
              <AuthModalTrigger
                mode="login"
                aria-label={searchT("label")}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#ddd0bf] bg-white/60 text-[#7a6a58] transition-colors hover:border-[#c9b89e] hover:text-[#3d2e22]"
              >
                <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
                  <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M14 14l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </AuthModalTrigger>
            </Suspense>
          )}

          {canOpenAuthModal ? (
            <Suspense
              fallback={
                <Link href={accountHref} className={buttonStyles({ variant: "secondary", size: "sm" })}>
                  {accountLabel}
                </Link>
              }
            >
              <AuthModalTrigger mode="login" className={buttonStyles({ variant: "secondary", size: "sm" })}>
                {accountLabel}
              </AuthModalTrigger>
            </Suspense>
          ) : (
            <Link href={accountHref} className={buttonStyles({ variant: "secondary", size: "sm" })}>
              {accountLabel}
            </Link>
          )}
          <Link href="/perfumes" className={buttonStyles({ size: "sm" })}>
            {t("cta")}
          </Link>
        </nav>

        <button
          type="button"
          onClick={handleMenuToggle}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation-panel"
          className={cn(
            "inline-flex h-11 items-center gap-3 rounded-full border px-3.5 text-xs font-semibold uppercase tracking-[0.18em] shadow-[0_18px_40px_-28px_rgba(31,25,20,0.9)] backdrop-blur-sm transition-all md:hidden",
            menuOpen
              ? "border-[#204f3f] bg-[#1e4b3b] text-white"
              : "border-[#d8cbb9] bg-white/70 text-[#3e3025] hover:border-[#cfbda5] hover:bg-white",
          )}
        >
          <span
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full border transition-colors",
              menuOpen ? "border-white/20 bg-white/10" : "border-[#dccbb4] bg-[#f4ece1]",
            )}
            aria-hidden="true"
          >
            <span className="relative flex h-3.5 w-4 flex-col justify-between">
              <span
                className={cn(
                  "h-[1.5px] w-full rounded-full bg-current transition-transform duration-200",
                  menuOpen && "translate-y-[6px] rotate-45",
                )}
              />
              <span
                className={cn(
                  "h-[1.5px] w-full rounded-full bg-current transition-opacity duration-200",
                  menuOpen && "opacity-0",
                )}
              />
              <span
                className={cn(
                  "h-[1.5px] w-full rounded-full bg-current transition-transform duration-200",
                  menuOpen && "-translate-y-[6px] -rotate-45",
                )}
              />
            </span>
          </span>
          <span>{menuOpen ? t("close") : t("menu")}</span>
        </button>
      </div>

      <div
        className={cn(
          `fixed inset-x-0 bottom-0 ${APP_HEADER_OFFSET_CLASS} z-30 transition-opacity duration-300 md:hidden`,
          menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <button
          type="button"
          aria-label={t("close")}
          onClick={() => setMenuOpen(false)}
          className={cn(
            "absolute inset-0 transition-[background-color,opacity,backdrop-filter] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            menuOpen
              ? "bg-[rgba(24,20,16,0.26)] opacity-100 backdrop-blur-[22px]"
              : "bg-[rgba(24,20,16,0.02)] opacity-0 backdrop-blur-none",
          )}
        />

        <div
          id="mobile-navigation-panel"
          className={cn(
            "relative mx-4 mt-3 max-h-[calc(100dvh-5.5rem-env(safe-area-inset-bottom))] overflow-y-auto overflow-x-hidden overscroll-none rounded-[2rem] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.84),rgba(248,242,234,0.76))] shadow-[0_42px_120px_-42px_rgba(29,22,16,0.62)] backdrop-blur-[26px] backdrop-saturate-125 transition-all duration-300 [-webkit-overflow-scrolling:touch] before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.58),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(226,211,192,0.22),transparent_34%)] before:content-['']",
            menuOpen ? "translate-y-0 scale-100 opacity-100" : "-translate-y-4 scale-[0.98] opacity-0",
          )}
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.95),transparent_42%),linear-gradient(135deg,rgba(225,212,192,0.7),rgba(255,255,255,0.05))]" />

          <div className="relative px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-5">
            <div className="mb-5 border-b border-[#eadfce] pb-4">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.34em] text-[#8c745c]">
                {t("eyebrow")}
              </p>
              <div className="relative mt-3 pr-16 sm:pr-18">
                <p className="min-w-0 whitespace-nowrap font-display text-[1.72rem] leading-[0.95] text-[#2b2119] sm:text-[1.95rem]">
                  {t("introTitle")}
                </p>
                <div
                  aria-hidden="true"
                  className="absolute right-0 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full border border-[#e6d9c8] bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.85),rgba(231,217,198,0.9))] shadow-[0_18px_32px_-24px_rgba(31,25,20,0.6)] sm:h-12 sm:w-12"
                />
              </div>
              <p className="mt-4 text-sm leading-6 text-[#705b49]">{t("introDescription")}</p>
              <div className="mt-4">
                <MobileSearchButton
                  isAuthenticated={isAuthenticated}
                  label={searchT("label")}
                  onOpenSearch={() => { setMenuOpen(false); setSearchOpen(true); }}
                  onCloseMenu={() => setMenuOpen(false)}
                />
              </div>
            </div>

            <div className="space-y-2.5">
              {navItems.map((item, index) => {
                const active = isActivePath(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "group flex items-center justify-between rounded-[1.4rem] border px-4 py-3.5 transition-all",
                      active
                        ? "border-[#204f3f]/15 bg-[#1e4b3b] text-white shadow-[0_18px_45px_-28px_rgba(30,75,59,0.95)]"
                        : "border-[#eadfce] bg-white/80 text-[#3d3026] hover:border-[#d6c3ac] hover:bg-[#fffdf9]",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-full text-[0.72rem] font-semibold tracking-[0.14em]",
                          active ? "bg-white/12 text-white" : "bg-[#f3eadf] text-[#8b735d]",
                        )}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="text-base font-medium">{item.label}</span>
                    </div>

                    <span
                      className={cn(
                        "transition-transform group-hover:translate-x-0.5",
                        active ? "text-white/80" : "text-[#9f876f]",
                      )}
                      aria-hidden="true"
                    >
                      <svg
                        viewBox="0 0 16 16"
                        fill="none"
                        className="h-4 w-4"
                      >
                        <path
                          d="M4 12L12 4M6 4H12V10"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </Link>
                );
              })}
            </div>

            <div className="mt-5 grid gap-3 rounded-[1.6rem] border border-[#eadfce] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(245,238,229,0.98))] p-3 shadow-[0_18px_35px_-30px_rgba(31,25,20,0.45)] backdrop-blur-xl">
              {canOpenAuthModal ? (
                <Suspense
                  fallback={
                    <Link
                      href={accountHref}
                      onClick={() => setMenuOpen(false)}
                      className={buttonStyles({
                        size: "md",
                        variant: "secondary",
                        className: "w-full justify-center",
                      })}
                    >
                      {accountLabel}
                    </Link>
                  }
                >
                  <AuthModalTrigger
                    mode="login"
                    onOpen={() => setMenuOpen(false)}
                    className={buttonStyles({
                      size: "md",
                      variant: "secondary",
                      className: "w-full justify-center",
                    })}
                  >
                    {accountLabel}
                  </AuthModalTrigger>
                </Suspense>
              ) : (
                <Link
                  href={accountHref}
                  onClick={() => setMenuOpen(false)}
                  className={buttonStyles({
                    size: "md",
                    variant: "secondary",
                    className: "w-full justify-center",
                  })}
                >
                  {accountLabel}
                </Link>
              )}

              <Link
                href="/perfumes"
                onClick={() => setMenuOpen(false)}
                className={buttonStyles({ size: "md", className: "w-full justify-center" })}
              >
                {t("cta")}
              </Link>
            </div>
          </div>
        </div>
      </div>

    </header>
    <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
