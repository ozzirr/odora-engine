"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

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
  return (
    <button
      {...props}
      type={type}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) {
          return;
        }

        const { pathname, search, hash } = window.location;
        window.history.pushState(
          null,
          "",
          buildAuthModalUrl(pathname, new URLSearchParams(search), mode, hash),
        );
        onOpen?.();
      }}
    >
      {children}
    </button>
  );
}
