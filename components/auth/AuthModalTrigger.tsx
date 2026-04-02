"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { buildAuthModalUrl, type AuthMode } from "@/lib/auth-modal";

type AuthModalTriggerProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  children: ReactNode;
  mode: AuthMode;
  onOpen?: () => void;
};

export function AuthModalTrigger({
  children,
  mode,
  onClick,
  onOpen,
  type = "button",
  ...props
}: AuthModalTriggerProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <button
      {...props}
      type={type}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) {
          return;
        }

        const hash = window.location.hash;
        window.history.pushState(null, "", buildAuthModalUrl(pathname, searchParams, mode, hash));
        onOpen?.();
      }}
    >
      {children}
    </button>
  );
}
