"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { buttonStyles } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/perfumes", label: "Perfumes" },
  { href: "/finder", label: "Finder" },
  { href: "/top", label: "Top" },
];

export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActivePath = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#e8dfd2] bg-[#fbf8f2]/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="font-display text-3xl text-[#1f1914]">
          Odora
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm font-medium text-[#554636] transition-colors hover:text-[#1f1914]",
                isActivePath(item.href) && "text-[#1f1914]",
              )}
            >
              {item.label}
            </Link>
          ))}
          <Link href="/perfumes" className={buttonStyles({ size: "sm" })}>
            Explore perfumes
          </Link>
        </nav>

        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          className="inline-flex items-center rounded-md border border-[#d8cbb9] px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#3e3025] md:hidden"
        >
          Menu
        </button>
      </div>

      {menuOpen ? (
        <div className="border-t border-[#e8dfd2] bg-[#fbf8f2] px-4 py-4 md:hidden">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium text-[#554636]",
                  isActivePath(item.href) && "bg-[#ece4d8] text-[#1f1914]",
                )}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/perfumes"
              onClick={() => setMenuOpen(false)}
              className={buttonStyles({ size: "sm", className: "mt-2 w-fit" })}
            >
              Explore perfumes
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
